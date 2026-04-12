import { getStudentReachRepository } from "@/server/repositories";
import { getResearcherInsightGeneration } from "@/server/ai/generation-service";

async function main() {
  const researcherId = process.argv[2];
  if (!researcherId) {
    throw new Error("Usage: npm run db:refresh:researcher -- <researcher-id>");
  }

  const repository = getStudentReachRepository();
  const researcher = await repository.getResearcher(researcherId);
  if (!researcher) {
    throw new Error(`Researcher not found: ${researcherId}`);
  }

  const insight = await getResearcherInsightGeneration(researcherId);
  console.log(JSON.stringify(insight, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
