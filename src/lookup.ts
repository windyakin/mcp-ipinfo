import { basename } from "node:path";
import maxmind, { Reader, Response } from "maxmind";
import type {
  DatabaseType,
  DbInfoEntry,
  DbLookupEntry,
  LoadedDatabase,
  LookupResult,
} from "./types.js";

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
  const usedNames = new Set<string>();
  for (const path of paths) {
    const reader = await maxmind.open<Response>(path);
    const type = detectDatabaseType(reader);
    const base = basename(path);
    let name = base;
    let i = 2;
    while (usedNames.has(name)) {
      name = `${base}#${i}`;
      i++;
    }
    usedNames.add(name);
    databases.push({ type, path, name, reader });
  }
  return databases;
}

export function lookupIp(
  databases: LoadedDatabase[],
  ip: string
): LookupResult {
  if (!maxmind.validate(ip)) {
    return { error: `"${ip}" is not a valid IPv4 or IPv6 address.` };
  }

  const result: Record<string, DbLookupEntry> = {};
  for (const db of databases) {
    result[db.name] = { type: db.type, data: db.reader.get(ip) ?? null };
  }
  return result;
}

export function getDatabaseInfo(
  databases: LoadedDatabase[]
): Record<string, DbInfoEntry> {
  const info: Record<string, DbInfoEntry> = {};
  for (const db of databases) {
    const meta = db.reader.metadata;
    info[db.name] = {
      type: db.type,
      path: db.path,
      databaseType: meta.databaseType,
      ipVersion: meta.ipVersion,
      nodeCount: meta.nodeCount,
      buildDate: new Date(meta.buildEpoch as unknown as number).toISOString(),
    };
  }
  return info;
}
