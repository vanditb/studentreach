import { apiError, apiSuccess } from "@/server/api/responses";
import { saveDraftSchema } from "@/server/api/schemas";
import { requireRequestUser } from "@/server/auth/request-user";
import { getStudentReachRepository } from "@/server/repositories";

export async function POST(request: Request) {
  try {
    const user = await requireRequestUser();
    const payload = saveDraftSchema.parse(await request.json());
    const repository = getStudentReachRepository();
    const saved = await repository.saveDraft(user.id, payload.draft);
    return apiSuccess(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save draft.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}
