import { apiError, apiSuccess } from "@/server/api/responses";
import { getStudentReachRepository } from "@/server/repositories";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const repository = getStudentReachRepository();
    const publications = await repository.getResearcherPublications(id);
    return apiSuccess(publications);
  } catch (error) {
    return apiError("Unable to load publications.", 400, error instanceof Error ? error.message : error);
  }
}
