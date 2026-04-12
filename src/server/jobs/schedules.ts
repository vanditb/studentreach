export const jobSchedules = {
  universitySeed: "0 6 * * 1",
  openAlexRefresh: "0 */12 * * *",
  aiRefresh: "30 2 * * *",
  staleResearcherRefresh: "15 */6 * * *",
} as const;

export const jobDescriptions = {
  universitySeed: "Refreshes the curated list of active universities and remaps missing OpenAlex institution IDs.",
  openAlexRefresh: "Ingests fresh author/work data from OpenAlex for tracked universities and field buckets.",
  aiRefresh: "Refreshes stale cached insight generations for recently active researchers.",
  staleResearcherRefresh: "Re-enriches researchers whose public source data has aged past the configured freshness threshold.",
} as const;
