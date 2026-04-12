import { StudentReachIngestionPipeline } from "@/server/ingestion/pipeline";

async function main() {
  const pipeline = new StudentReachIngestionPipeline();
  await pipeline.seedUniversities();
  console.log("Seeded universities.");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
