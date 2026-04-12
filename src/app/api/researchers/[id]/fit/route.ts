import { apiError, apiSuccess } from "@/server/api/responses";
import { getResearcherInsightGeneration } from "@/server/ai/generation-service";
import { getRequestUser } from "@/server/auth/request-user";
import { getStudentReachRepository } from "@/server/repositories";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const repository = getStudentReachRepository();
    const user = await getRequestUser();
    const profile = user ? await repository.getStudentProfile(user.id) : null;
    const insight = await getResearcherInsightGeneration(id, profile);
    return apiSuccess({
      whyFit: insight.whyFit,
      currentFocus: insight.currentFocus,
      goodTalkingPoints: insight.goodTalkingPoints,
      workSummary: insight.workSummary,
    });
  } catch (error) {
    return apiError("Unable to load fit guidance.", 400, error instanceof Error ? error.message : error);
  }
}
