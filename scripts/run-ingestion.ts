import { StudentReachIngestionPipeline } from "@/server/ingestion/pipeline";

async function main() {
  const pipeline = new StudentReachIngestionPipeline();
  await pipeline.seedUniversities();
  await pipeline.mapOpenAlexInstitutions();
  await pipeline.ingestResearchers();
  console.log("Ingestion completed.");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
