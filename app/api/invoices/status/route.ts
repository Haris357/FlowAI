import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { generateInvoicePDF } from '@/lib/invoice-pdf';
import { invoiceStatusEmail, getInvoiceEmailSubject, InvoiceEmailType } from '@/lib/email-templates';
import { sendEmail } from '@/lib/email';
import { checkPlanLimitAdmin, getEmailSendCountAdmin } from '@/services/subscription-admin';

initAdmin();
const adminDb = getFirestore();

// Valid status transitions (mirrors lib/status-management.ts)
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['viewed', 'partial', 'paid', 'overdue', 'cancelled'],
  viewed: ['partial', 'paid', 'overdue', 'cancelled'],
  partial: ['paid', 'overdue', 'cancelled'],
  overdue: ['partial', 'paid', 'cancelled'],
  paid: ['refunded'],
  cancelled: ['draft'],
  refunded: [],
};

// Statuses that trigger notification emails
const EMAIL_STATUSES: InvoiceEmailType[] = ['sent', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'];

// Statuses that include PDF attachment in the email
const ATTACH_PDF_STATUSES: InvoiceEmailType[] = ['sent', 'overdue'];

// Helper: get account preferences from Firestore (admin)
async function getPreferences(companyId: string): Promise<Record<string, string>> {
  const prefSnap = await adminDb.doc(`companies/${companyId}/settings/account_preferences`).get();
  return prefSnap.exists ? (prefSnap.data() as Record<string, string>) : {};
}

// Helper: find an account by query with optional preferred ID
async function findAccount(
  companyId: string,
  typeField: string,
  typeValue: string,
  nameHints: string[],
  preferredId?: string
): Promise<{ id: string; data: any } | null> {
  const accountsRef = adminDb.collection(`companies/${companyId}/chartOfAccounts`);

  // If a preferred account ID is set, try that first
  if (preferredId) {
    const prefSnap = await accountsRef.doc(preferredId).get();
    if (prefSnap.exists && prefSnap.data()?.isActive !== false) {
      return { id: prefSnap.id, data: prefSnap.data() };
    }
  }

  const q = accountsRef.where(typeField, '==', typeValue);
  const snapshot = await q.get();
  if (snapshot.empty) return null;

  const match = snapshot.docs.find(d => {
    const name = (d.data().name || '').toLowerCase();
    return nameHints.some(hint => name.includes(hint));
  }) || snapshot.docs[0];

  return { id: match.id, data: match.data() };
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, invoiceId, newStatus, paymentAmount } = await request.json();

    if (!companyId || !invoiceId || !newStatus) {
      return NextResponse.json(
        { error: 'companyId, invoiceId, and newStatus are required' },
        { status: 400 }
      );
    }

    // Fetch invoice
    const invoiceRef = adminDb.doc(`companies/${companyId}/invoices/${invoiceId}`);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const invoice = { id: invoiceSnap.id, ...invoiceSnap.data() } as any;
    const currentStatus = invoice.status;

    // Validate transition
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot change from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}` },
        { status: 400 }
      );
    }

    // Fetch company
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

    // Load account preferences once for all transitions
    const prefs = await getPreferences(companyId);

    // Track what accounting was done
    const accountingActions: string[] = [];

    // ============================================================
    // ACCOUNTING LOGIC PER STATUS TRANSITION
    // ============================================================

    if (newStatus === 'sent' && currentStatus === 'draft') {
      // ---- SENT: Recognize revenue (Debit AR, Credit Revenue) ----
      const arAccount = await findAccount(companyId, 'subtypeCode', 'current_asset', ['receivable', 'ar'], prefs.defaultReceivableAccountId);
      const revAccount = await findAccount(companyId, 'typeCode', 'revenue', ['revenue', 'sales', 'income'], prefs.defaultRevenueAccountId);

      if (arAccount && revAccount) {
        await adminDb.collection(`companies/${companyId}/journalEntries`).add({
          date: Timestamp.now(),
          description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
          lines: [
            {
              accountId: arAccount.id,
              accountCode: arAccount.data.code || '',
              accountName: arAccount.data.name,
              description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
              debit: invoice.total,
              credit: 0,
            },
            {
              accountId: revAccount.id,
              accountCode: revAccount.data.code || '',
              accountName: revAccount.data.name,
              description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
              debit: 0,
              credit: invoice.total,
            },
          ],
          reference: invoice.invoiceNumber,
          referenceType: 'invoice',
          referenceId: invoiceId,
          totalDebit: invoice.total,
          totalCredit: invoice.total,
          createdBy: 'system',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Update account balances
        await adminDb.doc(`companies/${companyId}/chartOfAccounts/${arAccount.id}`).update({
          balance: (arAccount.data.balance || 0) + invoice.total,
          updatedAt: Timestamp.now(),
        });
        await adminDb.doc(`companies/${companyId}/chartOfAccounts/${revAccount.id}`).update({
          balance: (revAccount.data.balance || 0) + invoice.total,
          updatedAt: Timestamp.now(),
        });

        // Update customer balance
        if (invoice.customerId) {
          const customerRef = adminDb.doc(`companies/${companyId}/customers/${invoice.customerId}`);
          const customerSnap = await customerRef.get();
          if (customerSnap.exists) {
            const cData = customerSnap.data() as any;
            await customerRef.update({
              totalInvoiced: (cData.totalInvoiced || 0) + invoice.total,
              outstandingBalance: ((cData.totalInvoiced || 0) + invoice.total) - (cData.totalPaid || 0),
              updatedAt: Timestamp.now(),
            });
          }
        }

        accountingActions.push(`Journal entry: Debit AR ${invoice.total}, Credit Revenue ${invoice.total}`);
      }

      // Update invoice
      await invoiceRef.update({
        status: 'sent',
        sentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

    } else if (newStatus === 'paid') {
      // ---- PAID: Record full remaining payment (Debit Bank, Credit AR) ----
      const remainingDue = invoice.amountDue ?? (invoice.total - (invoice.amountPaid || 0));
      const pAmount = paymentAmount || remainingDue;

      if (pAmount > 0) {
        const bankAccount = await findAccount(companyId, 'typeCode', 'asset', ['cash', 'bank', 'checking'], prefs.defaultCashAccountId);
        const arAccount = await findAccount(companyId, 'subtypeCode', 'current_asset', ['receivable', 'ar'], prefs.defaultReceivableAccountId);

        if (bankAccount && arAccount) {
          await adminDb.collection(`companies/${companyId}/journalEntries`).add({
            date: Timestamp.now(),
            description: `Payment received - Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
            lines: [
              {
                accountId: bankAccount.id,
                accountCode: bankAccount.data.code || '',
                accountName: bankAccount.data.name,
                description: `Payment received - Invoice ${invoice.invoiceNumber}`,
                debit: pAmount,
                credit: 0,
              },
              {
                accountId: arAccount.id,
                accountCode: arAccount.data.code || '',
                accountName: arAccount.data.name,
                description: `Payment received - Invoice ${invoice.invoiceNumber}`,
                debit: 0,
                credit: pAmount,
              },
            ],
            reference: `PMT-${invoice.invoiceNumber}`,
            referenceType: 'payment',
            referenceId: invoiceId,
            totalDebit: pAmount,
            totalCredit: pAmount,
            createdBy: 'system',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          // Update account balances
          await adminDb.doc(`companies/${companyId}/chartOfAccounts/${bankAccount.id}`).update({
            balance: (bankAccount.data.balance || 0) + pAmount,
            updatedAt: Timestamp.now(),
          });
          await adminDb.doc(`companies/${companyId}/chartOfAccounts/${arAccount.id}`).update({
            balance: (arAccount.data.balance || 0) - pAmount,
            updatedAt: Timestamp.now(),
          });

          // Update customer balance
          if (invoice.customerId) {
            const customerRef = adminDb.doc(`companies/${companyId}/customers/${invoice.customerId}`);
            const customerSnap = await customerRef.get();
            if (customerSnap.exists) {
              const cData = customerSnap.data() as any;
              await customerRef.update({
                totalPaid: (cData.totalPaid || 0) + pAmount,
                outstandingBalance: (cData.totalInvoiced || 0) - ((cData.totalPaid || 0) + pAmount),
                updatedAt: Timestamp.now(),
              });
            }
          }

          accountingActions.push(`Payment recorded: Debit Bank ${pAmount}, Credit AR ${pAmount}`);
        }
      }

      // Update invoice
      const newPaid = (invoice.amountPaid || 0) + (pAmount || 0);
      await invoiceRef.update({
        status: 'paid',
        amountPaid: newPaid,
        amountDue: 0,
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

    } else if (newStatus === 'partial') {
      // ---- PARTIAL: Record partial payment (Debit Bank, Credit AR) ----
      const pAmount = paymentAmount || 0;

      if (pAmount > 0) {
        const bankAccount = await findAccount(companyId, 'typeCode', 'asset', ['cash', 'bank', 'checking'], prefs.defaultCashAccountId);
        const arAccount = await findAccount(companyId, 'subtypeCode', 'current_asset', ['receivable', 'ar'], prefs.defaultReceivableAccountId);

        if (bankAccount && arAccount) {
          await adminDb.collection(`companies/${companyId}/journalEntries`).add({
            date: Timestamp.now(),
            description: `Partial payment - Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
            lines: [
              {
                accountId: bankAccount.id,
                accountCode: bankAccount.data.code || '',
                accountName: bankAccount.data.name,
                description: `Partial payment - Invoice ${invoice.invoiceNumber}`,
                debit: pAmount,
                credit: 0,
              },
              {
                accountId: arAccount.id,
                accountCode: arAccount.data.code || '',
                accountName: arAccount.data.name,
                description: `Partial payment - Invoice ${invoice.invoiceNumber}`,
                debit: 0,
                credit: pAmount,
              },
            ],
            reference: `PMT-${invoice.invoiceNumber}`,
            referenceType: 'payment',
            referenceId: invoiceId,
            totalDebit: pAmount,
            totalCredit: pAmount,
            createdBy: 'system',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          // Update account balances
          await adminDb.doc(`companies/${companyId}/chartOfAccounts/${bankAccount.id}`).update({
            balance: (bankAccount.data.balance || 0) + pAmount,
            updatedAt: Timestamp.now(),
          });
          await adminDb.doc(`companies/${companyId}/chartOfAccounts/${arAccount.id}`).update({
            balance: (arAccount.data.balance || 0) - pAmount,
            updatedAt: Timestamp.now(),
          });

          // Update customer balance
          if (invoice.customerId) {
            const customerRef = adminDb.doc(`companies/${companyId}/customers/${invoice.customerId}`);
            const customerSnap = await customerRef.get();
            if (customerSnap.exists) {
              const cData = customerSnap.data() as any;
              await customerRef.update({
                totalPaid: (cData.totalPaid || 0) + pAmount,
                outstandingBalance: (cData.totalInvoiced || 0) - ((cData.totalPaid || 0) + pAmount),
                updatedAt: Timestamp.now(),
              });
            }
          }

          accountingActions.push(`Partial payment recorded: Debit Bank ${pAmount}, Credit AR ${pAmount}`);
        }
      }

      // Update invoice
      const newPaid = (invoice.amountPaid || 0) + pAmount;
      const newDue = invoice.total - newPaid;
      await invoiceRef.update({
        status: 'partial',
        amountPaid: newPaid,
        amountDue: Math.max(0, newDue),
        updatedAt: Timestamp.now(),
      });

    } else if (newStatus === 'cancelled') {
      // ---- CANCELLED: Reverse outstanding AR/Revenue ----
      // Only reverse if the invoice was previously recognized (i.e., was sent/viewed/partial/overdue)
      const wasRecognized = ['sent', 'viewed', 'partial', 'overdue'].includes(currentStatus);

      if (wasRecognized) {
        const remainingDue = invoice.amountDue ?? (invoice.total - (invoice.amountPaid || 0));

        if (remainingDue > 0) {
          const arAccount = await findAccount(companyId, 'subtypeCode', 'current_asset', ['receivable', 'ar'], prefs.defaultReceivableAccountId);
          const revAccount = await findAccount(companyId, 'typeCode', 'revenue', ['revenue', 'sales', 'income'], prefs.defaultRevenueAccountId);

          if (arAccount && revAccount) {
            // Reverse remaining: Debit Revenue, Credit AR
            await adminDb.collection(`companies/${companyId}/journalEntries`).add({
              date: Timestamp.now(),
              description: `Invoice ${invoice.invoiceNumber} cancelled - reversal`,
              lines: [
                {
                  accountId: revAccount.id,
                  accountCode: revAccount.data.code || '',
                  accountName: revAccount.data.name,
                  description: `Cancelled - Invoice ${invoice.invoiceNumber}`,
                  debit: remainingDue,
                  credit: 0,
                },
                {
                  accountId: arAccount.id,
                  accountCode: arAccount.data.code || '',
                  accountName: arAccount.data.name,
                  description: `Cancelled - Invoice ${invoice.invoiceNumber}`,
                  debit: 0,
                  credit: remainingDue,
                },
              ],
              reference: `CAN-${invoice.invoiceNumber}`,
              referenceType: 'cancellation',
              referenceId: invoiceId,
              totalDebit: remainingDue,
              totalCredit: remainingDue,
              createdBy: 'system',
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });

            // Update account balances — reverse the outstanding amount
            await adminDb.doc(`companies/${companyId}/chartOfAccounts/${arAccount.id}`).update({
              balance: (arAccount.data.balance || 0) - remainingDue,
              updatedAt: Timestamp.now(),
            });
            await adminDb.doc(`companies/${companyId}/chartOfAccounts/${revAccount.id}`).update({
              balance: (revAccount.data.balance || 0) - remainingDue,
              updatedAt: Timestamp.now(),
            });

            // Update customer balance — reduce totalInvoiced by remaining
            if (invoice.customerId) {
              const customerRef = adminDb.doc(`companies/${companyId}/customers/${invoice.customerId}`);
              const customerSnap = await customerRef.get();
              if (customerSnap.exists) {
                const cData = customerSnap.data() as any;
                await customerRef.update({
                  totalInvoiced: Math.max(0, (cData.totalInvoiced || 0) - remainingDue),
                  outstandingBalance: Math.max(0, (cData.outstandingBalance || 0) - remainingDue),
                  updatedAt: Timestamp.now(),
                });
              }
            }

            accountingActions.push(`Reversal: Debit Revenue ${remainingDue}, Credit AR ${remainingDue}`);
          }
        }
      }

      await invoiceRef.update({
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

    } else if (newStatus === 'refunded') {
      // ---- REFUNDED: Reverse payment (Debit Revenue, Credit Bank) ----
      const refundAmount = invoice.amountPaid || invoice.total;

      if (refundAmount > 0) {
        const bankAccount = await findAccount(companyId, 'typeCode', 'asset', ['cash', 'bank', 'checking'], prefs.defaultCashAccountId);
        const revAccount = await findAccount(companyId, 'typeCode', 'revenue', ['revenue', 'sales', 'income'], prefs.defaultRevenueAccountId);

        if (bankAccount && revAccount) {
          await adminDb.collection(`companies/${companyId}/journalEntries`).add({
            date: Timestamp.now(),
            description: `Refund - Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
            lines: [
              {
                accountId: revAccount.id,
                accountCode: revAccount.data.code || '',
                accountName: revAccount.data.name,
                description: `Refund - Invoice ${invoice.invoiceNumber}`,
                debit: refundAmount,
                credit: 0,
              },
              {
                accountId: bankAccount.id,
                accountCode: bankAccount.data.code || '',
                accountName: bankAccount.data.name,
                description: `Refund - Invoice ${invoice.invoiceNumber}`,
                debit: 0,
                credit: refundAmount,
              },
            ],
            reference: `REF-${invoice.invoiceNumber}`,
            referenceType: 'refund',
            referenceId: invoiceId,
            totalDebit: refundAmount,
            totalCredit: refundAmount,
            createdBy: 'system',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          // Update account balances
          await adminDb.doc(`companies/${companyId}/chartOfAccounts/${bankAccount.id}`).update({
            balance: (bankAccount.data.balance || 0) - refundAmount,
            updatedAt: Timestamp.now(),
          });
          await adminDb.doc(`companies/${companyId}/chartOfAccounts/${revAccount.id}`).update({
            balance: (revAccount.data.balance || 0) - refundAmount,
            updatedAt: Timestamp.now(),
          });

          // Update customer balance
          if (invoice.customerId) {
            const customerRef = adminDb.doc(`companies/${companyId}/customers/${invoice.customerId}`);
            const customerSnap = await customerRef.get();
            if (customerSnap.exists) {
              const cData = customerSnap.data() as any;
              await customerRef.update({
                totalPaid: Math.max(0, (cData.totalPaid || 0) - refundAmount),
                outstandingBalance: (cData.totalInvoiced || 0) - Math.max(0, (cData.totalPaid || 0) - refundAmount),
                updatedAt: Timestamp.now(),
              });
            }
          }

          accountingActions.push(`Refund: Debit Revenue ${refundAmount}, Credit Bank ${refundAmount}`);
        }
      }

      await invoiceRef.update({
        status: 'refunded',
        refundedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

    } else {
      // ---- VIEWED, OVERDUE, etc.: No accounting impact, just status update ----
      const updateData: any = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };
      if (newStatus === 'overdue') updateData.overdueAt = Timestamp.now();

      await invoiceRef.update(updateData);
    }

    // ============================================================
    // SEND NOTIFICATION EMAIL (if applicable and customer has email)
    // ============================================================
    let emailSent = false;
    // Check email send limit before attempting to send
    let emailAllowed = true;
    if (invoice.customerEmail && EMAIL_STATUSES.includes(newStatus as InvoiceEmailType)) {
      try {
        const emailCount = await getEmailSendCountAdmin(companyId);
        const limitCheck = await checkPlanLimitAdmin(company.ownerId, 'emailSends', emailCount);
        emailAllowed = limitCheck.allowed;
      } catch {
        emailAllowed = false;
      }
    }
    if (emailAllowed && invoice.customerEmail && EMAIL_STATUSES.includes(newStatus as InvoiceEmailType)) {
      try {
        const emailType = newStatus as InvoiceEmailType;
        // Re-fetch invoice with updated fields for email
        const updatedSnap = await invoiceRef.get();
        const updatedInvoice = { id: updatedSnap.id, ...updatedSnap.data() } as any;

        const emailHtml = invoiceStatusEmail(emailType, updatedInvoice, company);
        const subject = getInvoiceEmailSubject(emailType, invoice.invoiceNumber, company.name);

        const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
        if (ATTACH_PDF_STATUSES.includes(emailType)) {
          const pdfBuffer = generateInvoicePDF(updatedInvoice, company);
          attachments.push({
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          });
        }

        await sendEmail(invoice.customerEmail, subject, emailHtml, attachments.length > 0 ? attachments : undefined);
        emailSent = true;
      } catch (emailError: any) {
        console.warn('[Invoice Status] Email failed (non-blocking):', emailError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} status changed to ${newStatus}`,
      previousStatus: currentStatus,
      newStatus,
      accountingActions,
      emailSent,
      emailRecipient: emailSent ? invoice.customerEmail : null,
    });

  } catch (error: any) {
    console.error('[Invoice Status] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update invoice status' },
      { status: 500 }
    );
  }
}
