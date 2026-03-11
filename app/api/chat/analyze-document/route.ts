import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// ==========================================
// DOCUMENT ANALYSIS PROMPT
// ==========================================

const ANALYSIS_SYSTEM_PROMPT = `You are an expert accounting document analyzer for Flowbooks, an AI accounting platform.

Your job is to analyze uploaded documents (invoices, bills, receipts, bank statements, spreadsheets) and extract structured accounting data.

IMPORTANT RULES:
1. Only extract accounting/financial data. Ignore non-financial content.
2. Always identify the document type (invoice, bill, receipt, bank_statement, expense_report, journal_entries, customer_list, vendor_list, other).
3. Extract all line items, totals, dates, parties, tax amounts, and references.
4. For spreadsheets with multiple entries, extract ALL rows as separate entries.
5. Normalize currency values to numbers (e.g., "$1,234.56" → 1234.56).
6. Use ISO date format (YYYY-MM-DD).
7. If uncertain about a value, include it with a "confidence" field of "low".

Respond with a JSON object (no markdown code fences) matching this structure:

{
  "documentType": "invoice" | "bill" | "receipt" | "bank_statement" | "expense_report" | "journal_entries" | "customer_list" | "vendor_list" | "other",
  "summary": "Brief description of the document",
  "suggestedAction": "create_invoice" | "create_bill" | "record_expense" | "create_journal_entry" | "add_customer" | "add_vendor" | "record_payment_received" | "record_payment_made" | "bulk_import",
  "entries": [
    {
      "type": "invoice" | "bill" | "expense" | "payment" | "journal_entry" | "customer" | "vendor",
      "data": {
        // For invoices/bills: customerName/vendorName, items: [{description, quantity, unitPrice, total}], subtotal, tax, total, dueDate, invoiceNumber
        // For expenses: description, amount, category, date, vendor
        // For journal entries: date, description, debits: [{account, amount}], credits: [{account, amount}]
        // For customers/vendors: name, email, phone, address
        // For payments: amount, date, reference, from/to
      }
    }
  ],
  "rawText": "Extracted text content from the document (first 2000 chars)"
}`;

// ==========================================
// HELPERS
// ==========================================

async function extractTextFromFile(
  fileUrl: string,
  mimeType: string,
  fileName: string
): Promise<{ text: string; base64?: string }> {
  // For images, we'll use GPT-4o vision — return base64
  if (mimeType.startsWith('image/')) {
    return { text: '', base64: fileUrl }; // URL is already accessible
  }

  // For PDFs and documents, fetch the file and extract text server-side
  const response = await fetch(fileUrl);
  if (!response.ok) {
    console.error('Failed to fetch file:', response.status, response.statusText);
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  if (mimeType === 'text/csv' || mimeType === 'text/plain' || fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    const text = await response.text();
    console.log(`[analyze-document] CSV/Text extracted: ${text.length} chars, first 200: ${text.substring(0, 200)}`);
    if (!text.trim()) {
      return { text: '[File appears to be empty]' };
    }
    return { text: text.substring(0, 15000) };
  }

  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    // For spreadsheets, convert to text using the xlsx library
    const buffer = await response.arrayBuffer();
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      let text = '';
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        text += `Sheet: ${sheetName}\n`;
        text += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
      }
      return { text: text.substring(0, 15000) };
    } catch {
      return { text: '[Unable to parse spreadsheet. Please check the file format.]' };
    }
  }

  if (mimeType === 'application/pdf') {
    // For PDFs, use GPT-4o vision — send the URL directly
    return { text: '', base64: fileUrl };
  }

  // For Word docs (.docx)
  if (mimeType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    const buffer = Buffer.from(await response.arrayBuffer());
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value.substring(0, 15000) };
    } catch {
      return { text: '[Unable to parse Word document.]' };
    }
  }

  return { text: '[Unsupported file format]' };
}

// ==========================================
// ROUTE HANDLER
// ==========================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileUrl, fileName, mimeType, companyId, userId } = body;

    if (!fileUrl || !fileName || !mimeType || !companyId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract text content from the file
    const { text, base64 } = await extractTextFromFile(fileUrl, mimeType, fileName);

    // Build the OpenAI messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
    ];

    if (base64) {
      // Image — use vision
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `Analyze this accounting document image (${fileName}). Extract all financial data and entries.` },
          { type: 'image_url', image_url: { url: base64, detail: 'high' } },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: `Analyze this accounting document.\n\nFile: ${fileName}\nType: ${mimeType}\n\nContent:\n${text}`,
      });
    }

    // Call OpenAI for analysis
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: base64 ? 'gpt-4o' : 'gpt-4.1-nano',
        messages,
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });
    } catch (aiError) {
      console.error('[analyze-document] OpenAI API error:', aiError);
      // Return raw text so the main AI can still process the document
      return NextResponse.json({
        success: true,
        analysis: {
          documentType: 'other',
          summary: `Document contains ${text?.length || 0} characters of text data`,
          suggestedAction: 'bulk_import',
          entries: [],
          rawText: text?.substring(0, 5000) || '',
        },
      });
    }

    const analysisText = completion.choices[0]?.message?.content || '{}';
    console.log(`[analyze-document] Raw OpenAI response (first 500): ${analysisText.substring(0, 500)}`);
    let analysis: Record<string, any>;

    try {
      analysis = JSON.parse(analysisText);
    } catch (parseErr) {
      console.error('[analyze-document] JSON parse failed:', parseErr);
      // Still include the raw text so the main AI can process it
      analysis = {
        documentType: 'other',
        summary: `Document extracted but analysis parsing failed. Raw content available.`,
        suggestedAction: 'bulk_import',
        entries: [],
        rawText: text?.substring(0, 5000) || '',
      };
    }

    console.log(`[analyze-document] Analysis result: type=${analysis.documentType}, entries=${analysis.entries?.length || 0}, summary=${analysis.summary?.substring(0, 100)}`);

    return NextResponse.json({
      success: true,
      analysis,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        model: completion.model,
      },
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze document' },
      { status: 500 }
    );
  }
}
