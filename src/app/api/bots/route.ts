import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientToken = searchParams.get('clientToken');

  if (!clientToken) {
    return NextResponse.json({ error: 'No client token provided' }, { status: 401 });
  }

  try {
    const bots = await prisma.bot.findMany({
      where: {
        clientToken: clientToken
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        personality: true,
        background: true,
        clientToken: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
        // Explicitly exclude madePublicAt if it doesn't exist in the database
      }
    });

    return NextResponse.json(bots || []);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching bots:', errorMessage);
    
    return NextResponse.json(
      { error: 'Failed to fetch bots' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientToken, ...botData } = body;

    if (!clientToken) {
      return NextResponse.json(
        { error: 'No client token provided' },
        { status: 401 }
      );
    }

    const bot = await prisma.bot.create({
      data: {
        ...botData,
        clientToken: clientToken,
      },
    });

    return NextResponse.json(bot);
  } catch (error) {
    console.error('Error creating bot:', error);
    return NextResponse.json(
      { error: 'Failed to create bot' },
      { status: 500 }
    );
  }
} 