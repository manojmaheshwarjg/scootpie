import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, swipes, collectionItems, collections, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, direction, sessionId, cardPosition, product: payloadProduct, tryOnImageUrl } = body as {
      productId: string;
      direction: 'left' | 'right' | 'up';
      sessionId?: string;
      cardPosition: number;
      tryOnImageUrl?: string;
      product?: {
        id?: string;
        externalId?: string;
        name: string;
        brand: string;
        price: number;
        currency: string;
        retailer: string;
        category: string;
        subcategory?: string;
        imageUrl: string;
        productUrl: string;
        description?: string;
        availableSizes?: string[];
        colors?: string[];
        inStock?: boolean;
        trending?: boolean;
        isNew?: boolean;
        isEditorial?: boolean;
        isExternal?: boolean;
      };
    };

    // Get user from database - use select for better error handling
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    // If user doesn't exist, create a minimal user record
    if (!user) {
      console.warn('[SWIPES] User not found in database, creating minimal user record for Clerk ID:', userId);
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        return NextResponse.json({ 
          error: 'Unable to retrieve user information.',
          code: 'USER_NOT_FOUND'
        }, { status: 401 });
      }

      // Create minimal user record
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.firstName || 'User',
        })
        .returning();
      
      user = newUser;
      
      // Create default "Likes" collection for the new user
      await db.insert(collections).values({
        userId: user.id,
        name: 'Likes',
        isDefault: true,
      });
      
      console.log('[SWIPES] Created new user:', {
        id: user.id,
        clerkId: user.clerkId,
        name: user.name,
      });
    } else {
      console.log('[SWIPES] Found user:', {
        id: user.id,
        clerkId: user.clerkId,
        name: user.name,
      });
    }

    // Validate sessionId is a valid UUID format, generate new one if invalid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let validSessionId: string;
    
    if (!sessionId || !uuidRegex.test(sessionId)) {
      // Generate a new UUID if the provided one is invalid
      const { randomUUID } = await import('crypto');
      validSessionId = randomUUID();
      console.warn(`Invalid sessionId provided: ${sessionId}. Generated new UUID: ${validSessionId}`);
    } else {
      validSessionId = sessionId;
    }

    // Ensure product is a DB product; if external id (non-UUID), upsert into products
    const uuidRegex2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let ensuredProductId: string = productId;

    if (!uuidRegex2.test(productId)) {
      // Attempt to find by externalId if provided
      let dbProduct = null as any;
      if (payloadProduct?.externalId) {
        dbProduct = await db.query.products.findFirst({
          where: eq(products.externalId, payloadProduct.externalId),
        });
      }
      if (!dbProduct && payloadProduct) {
        // Insert new DB product from payload
        const [inserted] = await db.insert(products).values({
          externalId: payloadProduct.externalId,
          name: payloadProduct.name,
          brand: payloadProduct.brand,
          price: String(isFinite(payloadProduct.price as any) ? payloadProduct.price : 0),
          currency: payloadProduct.currency || 'USD',
          retailer: payloadProduct.retailer,
          category: payloadProduct.category || 'search',
          subcategory: payloadProduct.subcategory,
          imageUrl: payloadProduct.imageUrl,
          productUrl: payloadProduct.productUrl,
          description: payloadProduct.description,
          availableSizes: payloadProduct.availableSizes as any,
          colors: payloadProduct.colors as any,
          inStock: payloadProduct.inStock ?? true,
          trending: payloadProduct.trending ?? false,
          isNew: payloadProduct.isNew ?? false,
          isEditorial: payloadProduct.isEditorial ?? false,
        }).returning();
        dbProduct = inserted;
      }
      if (dbProduct) {
        ensuredProductId = dbProduct.id;
      } else {
        // Fallback to original productId if no DB product could be found/created
        ensuredProductId = productId;
      }
    }

    // Verify user exists in database before inserting (double-check)
    const [verifyUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    if (!verifyUser) {
      console.error('[SWIPES] User verification failed - user ID not found:', user.id);
      return NextResponse.json({ 
        error: 'User record not found. Please complete your profile setup.',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }
    
    console.log('[SWIPES] User verified, proceeding with swipe insert:', {
      userId: verifyUser.id,
      productId: ensuredProductId,
      direction,
    });

    // Save swipe to database (using ensuredProductId)
    try {
      await db.insert(swipes).values({
        userId: verifyUser.id, // Use verified user ID
        productId: ensuredProductId,
        direction: direction as 'left' | 'right' | 'up',
        sessionId: validSessionId,
        cardPosition,
      });
      console.log('[SWIPES] Swipe saved successfully');
    } catch (insertError: any) {
      console.error('[SWIPES] Error inserting swipe:', {
        error: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
        userId: verifyUser.id,
        clerkId: verifyUser.clerkId,
        productId: ensuredProductId,
      });
      
      // Check if it's a foreign key constraint error
      if (insertError.code === '23503' || insertError.message?.includes('foreign key constraint')) {
        console.error('[SWIPES] Foreign key violation detected');
        console.error('[SWIPES] Error detail:', insertError.detail);
        
        // Try to get more info about the constraint
        if (insertError.detail) {
          console.error('[SWIPES] Constraint detail:', insertError.detail);
        }
        
        return NextResponse.json({ 
          error: 'Database constraint error. Please try again or contact support.',
          code: 'FOREIGN_KEY_ERROR',
          detail: insertError.detail,
        }, { status: 500 });
      }
      
      throw insertError; // Re-throw if it's a different error
    }

    // If swipe right (like), add to default collection (create if missing)
    if (direction === 'right') {
      let defaultCollection = await db.query.collections.findFirst({
        where: and(
          eq(collections.userId, user.id),
          eq(collections.isDefault, true)
        ),
      });

      if (!defaultCollection) {
        const [created] = await db.insert(collections).values({
          userId: user.id,
          name: 'Likes',
          isDefault: true,
        }).returning();
        defaultCollection = created;
      }

      if (defaultCollection) {
        // Check if item already exists in collection
        const existing = await db.query.collectionItems.findFirst({
          where: and(
            eq(collectionItems.collectionId, defaultCollection.id),
            eq(collectionItems.productId, ensuredProductId)
          ),
        });

        if (!existing) {
          await db.insert(collectionItems).values({
            collectionId: defaultCollection.id,
            productId: ensuredProductId,
            tryOnImageUrl: tryOnImageUrl,
          });
        } else if (tryOnImageUrl && !existing.tryOnImageUrl) {
          await db.update(collectionItems)
            .set({ tryOnImageUrl })
            .where(eq(collectionItems.id, existing.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Swipe recorded successfully',
    });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json(
      { error: 'Failed to record swipe' },
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

    // Get user from database - use select for consistency
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found. Please complete your profile setup first.',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Fetch user's swipes
    const userSwipes = await db.query.swipes.findMany({
      where: eq(swipes.userId, user.id),
      with: {
        product: true,
      },
      orderBy: (swipes, { desc }) => [desc(swipes.swipedAt)],
    });

    return NextResponse.json({
      swipes: userSwipes,
      message: 'Swipe history retrieved',
    });
  } catch (error) {
    console.error('Error fetching swipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swipes' },
      { status: 500 }
    );
  }
}
