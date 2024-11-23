import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const userData = await req.json();

    if (!userData || !userData.id) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { telegramId: userData.id },
      select: {
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
        invitedUsers: true,
        invitedBy: true,
        isOnline: true,
        currentTime: true
      }
    });

    const inviterId = userData.start_param ? parseInt(userData.start_param) : null;

    if (!user) {
      if (inviterId) {
        const inviterInfo = await prisma.user.findUnique({
          where: { telegramId: inviterId },
          select: { username: true, firstName: true, lastName: true }
        });

        if (inviterInfo) {
          user = await prisma.user.create({
            data: {
              telegramId: userData.id,
              username: userData.username || '',
              firstName: userData.first_name || '',
              lastName: userData.last_name || '',
              invitedBy: `@${inviterInfo.username || inviterId}`,
              isOnline: true,
              currentTime: new Date()
            }
          });

          // Award 2500 points to the inviter
          await prisma.user.update({
            where: { telegramId: inviterId },
            data: {
              invitedUsers: {
                push: `@${userData.username || userData.id}`
              },
              points: {
                increment: 2500
              }
            }
          });
        }
      } else {
        user = await prisma.user.create({
          data: {
            telegramId: userData.id,
            username: userData.username || '',
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            isOnline: true,
            currentTime: new Date()
          }
        });
      }
    } else {
      // Update user's online status and current time
      user = await prisma.user.update({
        where: { telegramId: userData.id },
        data: {
          isOnline: true,
          currentTime: new Date()
        }
      });
    }

    let inviterInfo = null;
    if (user.invitedBy) {
      inviterInfo = await prisma.user.findFirst({
        where: { 
          OR: [
            { username: user.invitedBy.replace('@', '') },
            { telegramId: parseInt(user.invitedBy.replace('@', '')) }
          ]
        },
        select: { username: true, firstName: true, lastName: true }
      });
    }

    return NextResponse.json({ user, inviterInfo });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

