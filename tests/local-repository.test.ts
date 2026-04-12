import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalDevRepository } from "@/server/repositories/local-dev-repository";

const testStorePath = path.join(os.tmpdir(), "studentreach-local-repository-test.json");

describe("local repository search", () => {
  beforeEach(async () => {
    process.env.STUDENTREACH_LOCAL_STORE_PATH = testStorePath;
    await rm(testStorePath, { force: true });
  });

  it("returns relevant professors for AI queries", async () => {
    const repository = new LocalDevRepository();
    const result = await repository.searchResearchers({
      topic: "trustworthy ML",
      location: "Berkeley, CA",
      radiusMiles: 100,
      field: "Computer Science / AI",
      university: "All",
      titles: ["Professor", "Associate Professor", "Assistant Professor"],
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]?.field).toBe("Computer Science / AI");
  });

  it("persists saved researchers for a user", async () => {
    const repository = new LocalDevRepository();
    const saved = await repository.toggleSavedResearcher("test-user", "cs-berkeley-elena-park");
    expect(saved).toContain("cs-berkeley-elena-park");
  });
});
