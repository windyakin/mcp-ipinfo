import type { Reader, Response } from "maxmind";

export type DatabaseType = "city" | "country" | "asn" | "ipinfo" | "unknown";

export interface LoadedDatabase {
  type: DatabaseType;
  path: string;
  reader: Reader<Response>;
}
