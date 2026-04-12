import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function getStorePath() {
  return process.env.STUDENTREACH_LOCAL_STORE_PATH ?? path.join(process.cwd(), ".data", "studentreach-local.json");
}

type LocalStore = {
  profiles: Record<string, unknown>;
  savedResearchers: Record<string, string[]>;
  drafts: Record<string, unknown[]>;
  aiCache: Record<string, unknown>;
};

const defaultStore: LocalStore = {
  profiles: {},
  savedResearchers: {},
  drafts: {},
  aiCache: {},
};

export async function readLocalStore(): Promise<LocalStore> {
  try {
    const raw = await readFile(getStorePath(), "utf8");
    return JSON.parse(raw) as LocalStore;
  } catch {
    return structuredClone(defaultStore);
  }
}

export async function writeLocalStore(store: LocalStore) {
  const storePath = getStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}
