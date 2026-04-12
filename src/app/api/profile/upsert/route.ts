import { apiError, apiSuccess } from "@/server/api/responses";
import { profileUpsertSchema } from "@/server/api/schemas";
import { requireRequestUser } from "@/server/auth/request-user";
import { getStudentReachRepository } from "@/server/repositories";

export async function GET() {
  try {
    const user = await requireRequestUser();
    const repository = getStudentReachRepository();
    const profile = await repository.getStudentProfile(user.id);
    return apiSuccess(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load profile.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}

export async function POST(request: Request) {
  try {
    const payload = profileUpsertSchema.parse(await request.json());
    const user = await requireRequestUser();
    const repository = getStudentReachRepository();
    const profile = await repository.saveStudentProfile(user.id, payload.profile);
    return apiSuccess(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save profile.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}
