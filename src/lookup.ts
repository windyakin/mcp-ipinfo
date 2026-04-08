import maxmind, {
  Reader,
  Response,
  CityResponse,
  CountryResponse,
  AsnResponse,
} from "maxmind";
import type { DatabaseType, LoadedDatabase } from "./types.js";

export function detectDatabaseType(reader: Reader<Response>): DatabaseType {
  const dbType = reader.metadata.databaseType;
  if (dbType.includes("City")) return "city";
  if (dbType.includes("Country")) return "country";
  if (dbType.includes("ASN")) return "asn";
  if (dbType.startsWith("ipinfo")) return "ipinfo";
  return "unknown";
}

export async function loadDatabases(
  paths: string[]
): Promise<LoadedDatabase[]> {
  const databases: LoadedDatabase[] = [];
  for (const path of paths) {
    const reader = await maxmind.open<Response>(path);
    const type = detectDatabaseType(reader);
    databases.push({ type, path, reader });
  }
  return databases;
}

function formatCityResponse(data: CityResponse): string[] {
  const lines: string[] = [];
  if (data.country) {
    lines.push(
      `Country: ${data.country.names?.en ?? ""}${data.country.iso_code ? ` (${data.country.iso_code})` : ""}`
    );
  }
  if (data.city) {
    lines.push(`City: ${data.city.names?.en ?? ""}`);
  }
  if (data.subdivisions && data.subdivisions.length > 0) {
    const sub = data.subdivisions[0];
    lines.push(
      `Subdivision: ${sub.names?.en ?? ""}${sub.iso_code ? ` (${sub.iso_code})` : ""}`
    );
  }
  if (data.postal) {
    lines.push(`Postal Code: ${data.postal.code ?? ""}`);
  }
  if (data.location) {
    const loc = data.location;
    if (loc.latitude != null && loc.longitude != null) {
      lines.push(`Location: ${loc.latitude}, ${loc.longitude}`);
    }
    if (loc.accuracy_radius != null) {
      lines.push(`Accuracy Radius: ${loc.accuracy_radius} km`);
    }
    if (loc.time_zone) {
      lines.push(`Timezone: ${loc.time_zone}`);
    }
  }
  if (data.continent) {
    lines.push(
      `Continent: ${data.continent.names?.en ?? ""}${data.continent.code ? ` (${data.continent.code})` : ""}`
    );
  }
  if (data.registered_country) {
    lines.push(
      `Registered Country: ${data.registered_country.names?.en ?? ""}${data.registered_country.iso_code ? ` (${data.registered_country.iso_code})` : ""}`
    );
  }
  return lines;
}

function formatCountryResponse(data: CountryResponse): string[] {
  const lines: string[] = [];
  if (data.country) {
    lines.push(
      `Country: ${data.country.names?.en ?? ""}${data.country.iso_code ? ` (${data.country.iso_code})` : ""}`
    );
  }
  if (data.continent) {
    lines.push(
      `Continent: ${data.continent.names?.en ?? ""}${data.continent.code ? ` (${data.continent.code})` : ""}`
    );
  }
  if (data.registered_country) {
    lines.push(
      `Registered Country: ${data.registered_country.names?.en ?? ""}${data.registered_country.iso_code ? ` (${data.registered_country.iso_code})` : ""}`
    );
  }
  return lines;
}

interface IpinfoRecord {
  [key: string]: unknown;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
  continent?: string;
  continent_code?: string;
  latitude?: string;
  longitude?: string;
  postal_code?: string;
  timezone?: string;
  asn?: string;
  as_name?: string;
  as_domain?: string;
}

function formatIpinfoResponse(data: IpinfoRecord): string[] {
  const lines: string[] = [];
  const fieldMap: [string, keyof IpinfoRecord][] = [
    ["Country", "country"],
    ["Country Code", "country_code"],
    ["Continent", "continent"],
    ["Continent Code", "continent_code"],
    ["Region", "region"],
    ["City", "city"],
    ["Postal Code", "postal_code"],
    ["Timezone", "timezone"],
    ["ASN", "asn"],
    ["AS Name", "as_name"],
    ["AS Domain", "as_domain"],
  ];

  for (const [label, key] of fieldMap) {
    const val = data[key];
    if (val != null && val !== "") {
      lines.push(`${label}: ${val}`);
    }
  }

  if (data.latitude != null && data.longitude != null) {
    lines.push(`Location: ${data.latitude}, ${data.longitude}`);
  }

  return lines;
}

function formatAsnResponse(data: AsnResponse): string[] {
  const lines: string[] = [];
  if (data.autonomous_system_number != null) {
    lines.push(`ASN: ${data.autonomous_system_number}`);
  }
  if (data.autonomous_system_organization) {
    lines.push(`Organization: ${data.autonomous_system_organization}`);
  }
  return lines;
}

export function lookupIp(
  databases: LoadedDatabase[],
  ip: string
): string {
  if (!maxmind.validate(ip)) {
    return `Error: "${ip}" is not a valid IPv4 or IPv6 address.`;
  }

  const lines: string[] = [`IP: ${ip}`];

  for (const db of databases) {
    const result = db.reader.get(ip);
    if (!result) continue;

    switch (db.type) {
      case "city":
        lines.push(...formatCityResponse(result as CityResponse));
        break;
      case "country":
        lines.push(...formatCountryResponse(result as CountryResponse));
        break;
      case "asn":
        lines.push(...formatAsnResponse(result as AsnResponse));
        break;
      case "ipinfo":
        lines.push(...formatIpinfoResponse(result as IpinfoRecord));
        break;
      default:
        lines.push(`Raw Data: ${JSON.stringify(result, null, 2)}`);
        break;
    }
  }

  if (lines.length === 1) {
    lines.push("No data found for this IP address.");
  }

  return lines.join("\n");
}

export function getDatabaseInfo(databases: LoadedDatabase[]): string {
  if (databases.length === 0) {
    return "No databases loaded.";
  }

  return databases
    .map((db, i) => {
      const meta = db.reader.metadata;
      const lines = [
        `Database ${i + 1}:`,
        `  Path: ${db.path}`,
        `  Type: ${meta.databaseType}`,
        `  IP Version: IPv${meta.ipVersion}`,
        `  Node Count: ${meta.nodeCount}`,
        `  Build Date: ${new Date(Number(meta.buildEpoch) * 1000).toISOString()}`,
      ];
      return lines.join("\n");
    })
    .join("\n\n");
}
