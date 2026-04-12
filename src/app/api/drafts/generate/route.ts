import { apiError, apiSuccess } from "@/server/api/responses";
import { draftGenerateSchema } from "@/server/api/schemas";
import { requireRequestUser } from "@/server/auth/request-user";
import { generateDraftForUser } from "@/server/ai/generation-service";

export async function POST(request: Request) {
  try {
    const payload = draftGenerateSchema.parse(await request.json());
    const user = await requireRequestUser();
    const draft = await generateDraftForUser({
      userId: user.id,
      researcherId: payload.researcherId,
      tone: payload.tone,
    });
    return apiSuccess(draft);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate draft.";
    return apiError(message, message === "Unauthorized" ? 401 : 400);
  }
}
