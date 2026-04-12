export type SeedLocation = {
  key: string;
  latitude: number;
  longitude: number;
  aliases?: string[];
};

export const seededLocations: SeedLocation[] = [
  { key: "boston, ma", latitude: 42.3601, longitude: -71.0589, aliases: ["02108", "02115", "boston"] },
  { key: "cambridge, ma", latitude: 42.3736, longitude: -71.1097, aliases: ["02138", "cambridge"] },
  { key: "new york, ny", latitude: 40.7128, longitude: -74.006, aliases: ["10001", "nyc", "new york city"] },
  { key: "philadelphia, pa", latitude: 39.9526, longitude: -75.1652, aliases: ["19104", "philadelphia"] },
  { key: "pittsburgh, pa", latitude: 40.4406, longitude: -79.9959, aliases: ["15213", "pittsburgh"] },
  { key: "berkeley, ca", latitude: 37.8715, longitude: -122.273, aliases: ["94720", "berkeley"] },
  { key: "stanford, ca", latitude: 37.4275, longitude: -122.1697, aliases: ["94305", "stanford"] },
  { key: "pasadena, ca", latitude: 34.1478, longitude: -118.1445, aliases: ["91125", "pasadena"] },
  { key: "los angeles, ca", latitude: 34.0522, longitude: -118.2437, aliases: ["90089", "90095", "los angeles"] },
  { key: "la jolla, ca", latitude: 32.8328, longitude: -117.2713, aliases: ["92093", "la jolla"] },
  { key: "davis, ca", latitude: 38.5449, longitude: -121.7405, aliases: ["95616", "davis"] },
  { key: "irvine, ca", latitude: 33.6846, longitude: -117.8265, aliases: ["92697", "irvine"] },
  { key: "seattle, wa", latitude: 47.6062, longitude: -122.3321, aliases: ["98195", "seattle"] },
  { key: "ann arbor, mi", latitude: 42.2808, longitude: -83.743, aliases: ["48109", "ann arbor"] },
  { key: "madison, wi", latitude: 43.0731, longitude: -89.4012, aliases: ["53706", "madison"] },
  { key: "austin, tx", latitude: 30.2672, longitude: -97.7431, aliases: ["78712", "austin"] },
  { key: "atlanta, ga", latitude: 33.749, longitude: -84.388, aliases: ["30332", "30322", "atlanta"] },
  { key: "houston, tx", latitude: 29.7604, longitude: -95.3698, aliases: ["77005", "77030", "houston"] },
  { key: "chicago, il", latitude: 41.8781, longitude: -87.6298, aliases: ["60637", "60611", "chicago"] },
  { key: "new haven, ct", latitude: 41.3083, longitude: -72.9279, aliases: ["06511", "new haven"] },
  { key: "princeton, nj", latitude: 40.3573, longitude: -74.6672, aliases: ["08544", "princeton"] },
  { key: "baltimore, md", latitude: 39.2904, longitude: -76.6122, aliases: ["21218", "baltimore"] },
  { key: "durham, nc", latitude: 35.994, longitude: -78.8986, aliases: ["27708", "durham"] },
  { key: "chapel hill, nc", latitude: 35.9132, longitude: -79.0558, aliases: ["27599", "chapel hill"] },
  { key: "nashville, tn", latitude: 36.1627, longitude: -86.7816, aliases: ["37240", "nashville"] },
  { key: "st. louis, mo", latitude: 38.627, longitude: -90.1994, aliases: ["63130", "st louis", "st. louis"] },
  { key: "evanston, il", latitude: 42.0451, longitude: -87.6877, aliases: ["60208", "evanston"] },
  { key: "ithaca, ny", latitude: 42.443, longitude: -76.5019, aliases: ["14853", "ithaca"] },
  { key: "college park, md", latitude: 38.9897, longitude: -76.9378, aliases: ["20742", "college park"] },
  { key: "minneapolis, mn", latitude: 44.9778, longitude: -93.265, aliases: ["55455", "minneapolis"] },
  { key: "columbus, oh", latitude: 39.9612, longitude: -82.9988, aliases: ["43210", "columbus"] },
  { key: "west lafayette, in", latitude: 40.4259, longitude: -86.9081, aliases: ["47907", "west lafayette"] },
  { key: "university park, pa", latitude: 40.8006, longitude: -77.86, aliases: ["16802", "university park"] },
  { key: "gainesville, fl", latitude: 29.6516, longitude: -82.3248, aliases: ["32611", "gainesville"] },
  { key: "tempe, az", latitude: 33.4255, longitude: -111.94, aliases: ["85281", "tempe"] },
  { key: "salt lake city, ut", latitude: 40.7608, longitude: -111.891, aliases: ["84112", "salt lake city"] },
];
