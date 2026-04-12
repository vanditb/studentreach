import { seededLocations } from "@/data/seed/locations";

export type GeocodeResult = {
  locationText: string;
  latitude: number;
  longitude: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function geocodeLocation(input: string | null | undefined): GeocodeResult | null {
  if (!input) {
    return null;
  }

  const normalized = normalize(input);
  const match = seededLocations.find(
    (location) =>
      location.key === normalized ||
      location.aliases?.some((alias) => normalize(alias) === normalized) ||
      location.key.includes(normalized),
  );

  if (!match) {
    return null;
  }

  return {
    locationText: input,
    latitude: match.latitude,
    longitude: match.longitude,
  };
}
