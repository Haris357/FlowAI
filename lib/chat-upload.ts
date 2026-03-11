import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { ChatAttachment } from '@/types';

// Allowed file types for accounting document uploads
const ALLOWED_MIME_TYPES: Record<string, ChatAttachment['type']> = {
  // Spreadsheets
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
  'application/vnd.ms-excel': 'spreadsheet',
  'text/csv': 'spreadsheet',
  // Documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/msword': 'document',
  'text/plain': 'document',
  // PDF
  'application/pdf': 'pdf',
  // Images (receipts, invoices scans)
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function isAllowedFileType(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES;
}

export function getFileCategory(mimeType: string): ChatAttachment['type'] | null {
  return ALLOWED_MIME_TYPES[mimeType] || null;
}

export function getAcceptString(): string {
  return Object.keys(ALLOWED_MIME_TYPES).join(',');
}

export function validateFile(file: File): string | null {
  if (!isAllowedFileType(file.type)) {
    return 'Unsupported file type. Upload spreadsheets (.xlsx, .csv), documents (.pdf, .docx), or images (.png, .jpg) of accounting documents.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum size is 10MB.';
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload a file to Firebase Storage under the chat path.
 * Returns a ChatAttachment with the download URL.
 */
export async function uploadChatFile(
  file: File,
  companyId: string,
  chatId: string,
): Promise<ChatAttachment> {
  const error = validateFile(file);
  if (error) throw new Error(error);

  const category = getFileCategory(file.type)!;
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `companies/${companyId}/chats/${chatId}/attachments/${timestamp}_${safeName}`;

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);

  return {
    id: `att_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type: category,
    mimeType: file.type,
    size: file.size,
    url,
    storagePath,
  };
}
