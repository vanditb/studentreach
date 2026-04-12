import { cookies, headers } from "next/headers";
import { createRouteHandlerSupabaseClient, createServiceRoleSupabaseClient } from "@/server/db/supabase";
import { hasSupabaseServerEnv } from "@/server/env";

export type RequestUser = {
  id: string;
  email: string;
  name: string;
  mode: "demo" | "supabase";
};

const DEMO_COOKIE_NAME = "studentreach-demo-user";

export async function getRequestUser(): Promise<RequestUser | null> {
  if (hasSupabaseServerEnv()) {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (bearerToken) {
      const serviceClient = createServiceRoleSupabaseClient();
      const { data } = await serviceClient!.auth.getUser(bearerToken);
      if (data.user) {
        return {
          id: data.user.id,
          email: data.user.email ?? "",
          name: data.user.user_metadata.full_name ?? data.user.email ?? "Student",
          mode: "supabase",
        };
      }
    }

    const supabase = await createRouteHandlerSupabaseClient();
    const { data } = await supabase!.auth.getUser();
    if (data.user) {
      return {
        id: data.user.id,
        email: data.user.email ?? "",
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Student",
        mode: "supabase",
      };
    }
  }

  const headerStore = await headers();
  const demoHeader = headerStore.get("x-studentreach-demo-user");
  if (demoHeader) {
    try {
      return JSON.parse(demoHeader) as RequestUser;
    } catch {
      return null;
    }
  }

  const cookieStore = await cookies();
  const demoCookie = cookieStore.get(DEMO_COOKIE_NAME)?.value;
  if (demoCookie) {
    try {
      return JSON.parse(demoCookie) as RequestUser;
    } catch {
      return null;
    }
  }

  return null;
}

export async function requireRequestUser() {
  const user = await getRequestUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export const requestUserCookieName = DEMO_COOKIE_NAME;
