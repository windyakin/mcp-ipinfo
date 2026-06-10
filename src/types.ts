import type { Reader, Response } from "maxmind";

export type DatabaseType = "city" | "country" | "asn" | "ipinfo" | "unknown";

export interface LoadedDatabase {
  type: DatabaseType;
  path: string;
  name: string;
  reader: Reader<Response>;
}

export interface DbLookupEntry {
  type: DatabaseType;
  data: unknown;
}

export type LookupError = { error: string };
export type LookupResult = LookupError | Record<string, DbLookupEntry>;

export interface DbInfoEntry {
  type: DatabaseType;
  path: string;
  databaseType: string;
  ipVersion: number;
  nodeCount: number;
  buildDate: string;
}
