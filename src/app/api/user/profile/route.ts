import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, photos, collections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, preferences, photoUrls, primaryPhotoIndex } = body;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    let dbUser;

    if (existingUser) {
      // Update existing user
      await db
        .update(users)
        .set({
          name: name || existingUser.name,
          preferences: preferences || existingUser.preferences,
        })
        .where(eq(users.id, existingUser.id));
      
      dbUser = existingUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: name || clerkUser.firstName || 'User',
          preferences,
        })
        .returning();
      
      dbUser = newUser;

      // Create default "Likes" collection
      await db.insert(collections).values({
        userId: newUser.id,
        name: 'Likes',
        isDefault: true,
      });
    }

    // Save photos if provided
    if (photoUrls && photoUrls.length > 0) {
      for (let i = 0; i < photoUrls.length; i++) {
        const [photo] = await db
          .insert(photos)
          .values({
            userId: dbUser.id,
            url: photoUrls[i],
            isPrimary: i === primaryPhotoIndex,
          })
          .returning();

        // Set primary photo ID
        if (i === primaryPhotoIndex) {
          await db
            .update(users)
            .set({ primaryPhotoId: photo.id })
            .where(eq(users.id, dbUser.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: dbUser,
      message: 'Profile created successfully',
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      with: {
        photos: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
