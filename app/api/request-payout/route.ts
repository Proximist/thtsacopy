// app/api/request-payout/route.ts
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
          push: `${upiId}_${new Date().toISOString()}`
        }
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json({ error: 'Failed to submit payout request' }, { status: 500 });
  }
}
