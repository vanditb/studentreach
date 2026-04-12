import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/server/api/responses";
import { requestUserCookieName } from "@/server/auth/request-user";

const schema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    mode: z.literal("demo"),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const cookieStore = await cookies();
    cookieStore.set(requestUserCookieName, JSON.stringify(payload.user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return apiSuccess({ ok: true });
  } catch (error) {
    return apiError("Unable to start demo session.", 400, error instanceof Error ? error.message : error);
  }
}
