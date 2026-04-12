import { apiError, apiSuccess } from "@/server/api/responses";
import { getStudentReachRepository } from "@/server/repositories";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const repository = getStudentReachRepository();
    const researcher = await repository.getResearcher(id);
    if (!researcher) {
      return apiError("Researcher not found.", 404);
    }
    return apiSuccess(researcher);
  } catch (error) {
    return apiError("Unable to load researcher.", 400, error instanceof Error ? error.message : error);
  }
}
