import { hasSupabaseServerEnv } from "@/server/env";
import { LocalDevRepository } from "@/server/repositories/local-dev-repository";
import { PostgresRepository } from "@/server/repositories/postgres-repository";

let localRepository: LocalDevRepository | null = null;
let postgresRepository: PostgresRepository | null = null;

export function getStudentReachRepository() {
  if (hasSupabaseServerEnv()) {
    if (!postgresRepository) {
      postgresRepository = new PostgresRepository();
    }
    return postgresRepository;
  }

  if (!localRepository) {
    localRepository = new LocalDevRepository();
  }

  return localRepository;
}
