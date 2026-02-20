export const ADMIN_EMAILS = [
  'harisimran7857@gmail.com',
  'haris2003x@gmail.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
