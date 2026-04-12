import { apiError, apiSuccess } from "@/server/api/responses";
import { requireRequestUser } from "@/server/auth/request-user";
import { getStudentReachRepository } from "@/server/repositories";

export async function GET() {
  try {
    const user = await requireRequestUser();
    const repository = getStudentReachRepository();
    const saved = await repository.listSavedResearchers(user.id);
    return apiSuccess(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load saved researchers.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}
