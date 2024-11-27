import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { telegramId, upiId } = await req.json();

    if (!telegramId || !upiId) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { telegramId },
      data: {
        requests: {
          push: {
            upiId,
            requestedAt: new Date()
          }
        }
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
