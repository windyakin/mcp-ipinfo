import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LoadedDatabase } from "./types.js";
import { lookupIp, getDatabaseInfo } from "./lookup.js";

export function createServer(databases: LoadedDatabase[]): McpServer {
  const server = new McpServer({
    name: "mcp-ipinfo",
    version: "0.1.0",
  });

  server.registerTool(
    "lookup_ip",
    {
      description:
        "Look up geolocation and network information for an IP address using the loaded MMDB database",
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
      const isError = result.startsWith("Error:");
      return {
        content: [{ type: "text", text: result }],
        isError,
      };
    }
  );

  server.registerTool(
    "lookup_ips",
    {
      description:
        "Look up information for multiple IP addresses at once (max 100)",
      inputSchema: {
        ips: z
          .array(z.string())
          .max(100)
          .describe("List of IPv4 or IPv6 addresses to look up"),
      },
    },
    async ({ ips }) => {
      const results = ips.map((ip) => lookupIp(databases, ip));
      return {
        content: [{ type: "text", text: results.join("\n---\n") }],
      };
    }
  );

  server.registerTool(
    "get_database_info",
    {
      description: "Get information about the loaded MMDB databases",
    },
    async () => {
      const info = getDatabaseInfo(databases);
      return {
        content: [{ type: "text", text: info }],
      };
    }
  );

  return server;
}
