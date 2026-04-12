import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/server/api/responses";
import { requireRequestUser } from "@/server/auth/request-user";
import { getStudentReachRepository } from "@/server/repositories";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRequestUser();
    const repository = getStudentReachRepository();
    const draftId = request.nextUrl.searchParams.get("draftId");
    if (draftId) {
      const draft = await repository.getDraft(user.id, draftId);
      return apiSuccess(draft);
    }
    const drafts = await repository.listDrafts(user.id);
    return apiSuccess(drafts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load drafts.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}
