import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LoadedDatabase, LookupResult } from "./types.js";
import { lookupIp, getDatabaseInfo } from "./lookup.js";

function toJsonText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createServer(databases: LoadedDatabase[]): McpServer {
  const server = new McpServer({
    name: "mcp-ipinfo",
    version: "0.1.0",
  });

  server.registerTool(
    "lookup_ip",
    {
      description:
        "Look up geolocation and network information for an IP address. Returns a JSON object keyed by database filename, with each entry containing the raw maxmind response.",
      inputSchema: {
        ip: z
          .string()
          .describe(
            "IPv4 or IPv6 address to look up (e.g. 8.8.8.8, 2001:4860:4860::8888)"
          ),
      },
    },
    async ({ ip }) => {
      const result = lookupIp(databases, ip);
      const isError = "error" in result;
      return {
        content: [{ type: "text", text: toJsonText(result) }],
        isError,
      };
    }
  );

  server.registerTool(
    "lookup_ips",
    {
      description:
        "Look up information for multiple IP addresses at once (max 100). Returns a JSON object keyed by IP, each value keyed by database filename.",
      inputSchema: {
        ips: z
          .array(z.string())
          .max(100)
          .describe("List of IPv4 or IPv6 addresses to look up"),
      },
    },
    async ({ ips }) => {
      const results: Record<string, LookupResult> = {};
      for (const ip of ips) {
        results[ip] = lookupIp(databases, ip);
      }
      return {
        content: [{ type: "text", text: toJsonText(results) }],
      };
    }
  );

  server.registerTool(
    "get_database_info",
    {
      description:
        "Get metadata about the loaded MMDB databases as a JSON object keyed by database filename.",
    },
    async () => {
      return {
        content: [
          { type: "text", text: toJsonText(getDatabaseInfo(databases)) },
        ],
      };
    }
  );

  return server;
}
