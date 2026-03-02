import { NextResponse } from 'next/server';

/**
 * @deprecated Token grants have been replaced by message grants.
 * Use /api/admin/users/[userId]/grant-messages instead.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Token grants have been discontinued. Use /api/admin/users/[userId]/grant-messages instead.' },
    { status: 410 }
  );
}
