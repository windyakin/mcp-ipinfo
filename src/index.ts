#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadDatabases } from "./lookup.js";
import { createServer } from "./server.js";

async function main() {
  const mmdbPaths = process.argv.slice(2);
  if (mmdbPaths.length === 0) {
    console.error(
      "Usage: mcp-ipinfo <path-to-mmdb> [additional-mmdb-paths...]"
    );
    process.exit(1);
  }

  const databases = await loadDatabases(mmdbPaths);
  console.error(
    `Loaded ${databases.length} database(s): ${databases.map((d) => d.type).join(", ")}`
  );

  const server = createServer(databases);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-ipinfo server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
