// lib/auth.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { cache } from 'react';
import { userSchema } from "@/shared/schema";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createServerSupabaseClient() {
  const cookieStore = await cookies(); // ✅ Await here

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll();
          return allCookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(newCookies) {
          newCookies.forEach(({ name, value, options }) => {
            cookieStore.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );
}

// ...rest of the code stays the same


/**
 * Gets the current authenticated user from the server
 * Cached to prevent multiple calls in the same request
 */
export const getServerUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Unexpected error in getServerUser:', error);
    return null;
  }
});

/**
 * Middleware to protect routes that require authentication
 */
export async function requireAuth(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getSession();
    
    // If no session, redirect to login
    if (!data.session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

/**
 * Helper function to verify authentication in route handlers
 */
export async function verifyAuthInRouteHandler() {
  try {
    const supabase = await createServerSupabaseClient(); // 👈 pass req
    // const { data } = await supabase.auth.getSession();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return {
        user: null,
        response: Response.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    return { user: userSchema.parse(data.user), response: null };
  } catch (error) {
    console.error('Route handler auth error:', error);
    return {
      user: null,
      response: Response.json(
        { error: 'Authentication error' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Helper to get user data for server components
 */
export async function getUserForServerComponent() {
  return await getServerUser();
}

/**
 * Helper to check if user has specific role or permission
 */
export async function hasPermission(permission: string) {
  console.log('Checking permission in hasPermission:', permission);
  const user = await getServerUser();
  
  if (!user) return false;
  
  // Implement your permission logic here
  // For example, check user.user_metadata.roles
  
  return false; // Replace with actual permission check
}
