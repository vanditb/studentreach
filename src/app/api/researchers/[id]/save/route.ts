import { apiError, apiSuccess } from "@/server/api/responses";
import { requireRequestUser } from "@/server/auth/request-user";
import { getStudentReachRepository } from "@/server/repositories";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireRequestUser();
    const repository = getStudentReachRepository();
    const saved = await repository.toggleSavedResearcher(user.id, id);
    return apiSuccess(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save researcher.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}
