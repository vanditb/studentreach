import { apiError, apiSuccess } from "@/server/api/responses";
import { draftFeedbackSchema } from "@/server/api/schemas";
import { requireRequestUser } from "@/server/auth/request-user";
import { generateDraftFeedback } from "@/server/ai/generation-service";

export async function POST(request: Request) {
  try {
    const payload = draftFeedbackSchema.parse(await request.json());
    const user = await requireRequestUser();
    const analysis = await generateDraftFeedback({
      userId: user.id,
      researcherId: payload.researcherId,
      content: payload.content,
      draftId: payload.draftId,
    });
    return apiSuccess(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate feedback.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}
