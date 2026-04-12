import { cookies } from "next/headers";
import { apiSuccess } from "@/server/api/responses";
import { requestUserCookieName } from "@/server/auth/request-user";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(requestUserCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return apiSuccess({ ok: true });
}
