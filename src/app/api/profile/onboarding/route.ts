import { apiError, apiSuccess } from "@/server/api/responses";
import { onboardingStateSchema } from "@/server/api/schemas";
import { requireRequestUser } from "@/server/auth/request-user";
import { getStudentReachRepository } from "@/server/repositories";

export async function GET() {
  try {
    const user = await requireRequestUser();
    const repository = getStudentReachRepository();
    const state = await repository.getOnboarding(user.id);
    return apiSuccess(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load onboarding.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRequestUser();
    const payload = onboardingStateSchema.parse(await request.json());
    const repository = getStudentReachRepository();
    const state = await repository.saveOnboarding(user.id, payload);
    return apiSuccess(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save onboarding.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}
