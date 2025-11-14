import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Temporary endpoint to fix empty string preferences in the database
 * This cleans up any empty size strings that shouldn't be there
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[FIX] Current preferences:', JSON.stringify(user.preferences, null, 2));

    // Clean preferences
    const prefs = user.preferences as any;
    const cleanedPrefs: any = {};

    // Only add gender if it's not empty
    if (prefs?.gender && prefs.gender.trim() !== '') {
      cleanedPrefs.gender = prefs.gender.trim();
    }

    // Clean sizes - only add non-empty values
    if (prefs?.sizes) {
      const cleanedSizes: any = {};
      if (prefs.sizes.top && prefs.sizes.top.trim() !== '') {
        cleanedSizes.top = prefs.sizes.top.trim();
      }
      if (prefs.sizes.bottom && prefs.sizes.bottom.trim() !== '') {
        cleanedSizes.bottom = prefs.sizes.bottom.trim();
      }
      if (prefs.sizes.shoes && prefs.sizes.shoes.trim() !== '') {
        cleanedSizes.shoes = prefs.sizes.shoes.trim();
      }
      if (Object.keys(cleanedSizes).length > 0) {
        cleanedPrefs.sizes = cleanedSizes;
      }
    }

    // Preserve budget range if it exists
    if (prefs?.budgetRange) {
      cleanedPrefs.budgetRange = prefs.budgetRange;
    }

    // Preserve style quiz responses if they exist
    if (prefs?.styleQuizResponses) {
      cleanedPrefs.styleQuizResponses = prefs.styleQuizResponses;
    }

    console.log('[FIX] Cleaned preferences:', JSON.stringify(cleanedPrefs, null, 2));

    // Update user with cleaned preferences
    await db
      .update(users)
      .set({ preferences: cleanedPrefs })
      .where(eq(users.id, user.id));

    // Fetch updated user
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    console.log('[FIX] Updated preferences:', JSON.stringify(updatedUser.preferences, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Preferences cleaned successfully',
      before: user.preferences,
      after: updatedUser.preferences,
    });
  } catch (error) {
    console.error('[FIX] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fix preferences' },
      { status: 500 }
    );
  }
}

