import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const { userId, companyId, chatId, messageId, userMessage, aiResponse, rating, complaint } = await req.json();

    if (!userId || !rating) {
      return NextResponse.json({ error: 'userId and rating required' }, { status: 400 });
    }

    await db.collection('chatFeedback').add({
      userId,
      companyId: companyId || null,
      chatId: chatId || null,
      messageId: messageId || null,
      userMessage: userMessage || '',
      aiResponse: aiResponse || '',
      rating, // 'like' or 'dislike'
      complaint: complaint || '',
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'Feedback saved' });
  } catch (error) {
    console.error('Error saving chat feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
