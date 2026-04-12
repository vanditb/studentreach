import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/server/api/responses";
import { searchResearchersSchema } from "@/server/api/schemas";
import { getRequestUser } from "@/server/auth/request-user";
import { getStudentReachRepository } from "@/server/repositories";
import { geocodeLocation } from "@/server/search/geocode";
import { normalizeFieldFilter } from "@/server/search/field-mapping";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = searchResearchersSchema.parse(searchParams);
    const repository = getStudentReachRepository();
    const user = await getRequestUser();
    const geocoded = geocodeLocation(parsed.location);

    const result = await repository.searchResearchers({
      topic: parsed.query,
      location: parsed.location,
      radiusMiles: parsed.radius,
      field: normalizeFieldFilter(parsed.field),
      university: parsed.university,
      titles: parsed.titles,
      page: parsed.page,
      pageSize: parsed.pageSize,
    });

    await repository.logSearchEvent({
      userId: user?.mode === "supabase" ? user.id : null,
      queryText: parsed.query,
      locationText: parsed.location,
      locationLat: geocoded?.latitude ?? null,
      locationLon: geocoded?.longitude ?? null,
      radiusMiles: parsed.radius,
      fieldFilter: parsed.field,
      universityFilter: parsed.university,
      resultsCount: result.total,
    });

    return apiSuccess(result);
  } catch (error) {
    return apiError("Unable to search researchers.", 400, error instanceof Error ? error.message : error);
  }
}
