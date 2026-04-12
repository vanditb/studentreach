import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { getServerEnv, hasSupabaseServerEnv } from "@/server/env";

export async function createRouteHandlerSupabaseClient() {
  if (!hasSupabaseServerEnv()) {
    return null;
  }

  const env = getServerEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Route handlers can safely ignore write failures during static rendering paths.
        }
      },
    },
  });
}

export function createServiceRoleSupabaseClient() {
  if (!hasSupabaseServerEnv()) {
    return null;
  }

  const env = getServerEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
