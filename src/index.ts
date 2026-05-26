#!/usr/bin/env node
/**
 * zapier-mcp-proxy — stdio entry point.
 *
 * Spawned by an MCP-compatible client (Claude Desktop, Cowork,
 * Claude Code, ClawBot). Acts as a thin proxy in front of
 * mcp.zapier.com so every agent can have its own configured action
 * surface with its own audit trail.
 *
 * For a LeadSimple-only variant, see the sibling `leadsimple-mcp`.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
import { log, setLogLevel } from "./log.js";
import { buildServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  setLogLevel(config.logLevel);

  const { server, upstream, toolCount } = await buildServer(config);

  const cleanShutdown = async (reason: string) => {
    log.info(`shutting down: ${reason}`);
    try {
      await upstream.close();
    } catch {
      // best effort
    }
    process.exit(0);
  };

  process.on("SIGINT", () => void cleanShutdown("SIGINT"));
  process.on("SIGTERM", () => void cleanShutdown("SIGTERM"));

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info(`ready — ${toolCount} Zapier tools available over stdio`);
}

main().catch((err) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`[zapier-mcp fatal] ${msg}\n`);
  process.exit(1);
});
