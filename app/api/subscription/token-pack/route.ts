import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Token packs have been discontinued. Please upgrade your plan for more messages.' },
    { status: 410 }
  );
}
