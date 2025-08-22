import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlist } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { message: 'Database connection not available' },
        { status: 500 }
      );
    }

    const { email } = await request.json();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Check if email already exists in waitlist
    const existingEntry = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .limit(1);

    if (existingEntry.length > 0) {
      return NextResponse.json(
        { message: 'This email is already on the waitlist!' },
        { status: 409 }
      );
    }

    // Insert new waitlist entry
    await db.insert(waitlist).values({
      email,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: 'Successfully joined the waitlist!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Waitlist registration error:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
