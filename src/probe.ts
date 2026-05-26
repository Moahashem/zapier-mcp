#!/usr/bin/env node
/**
 * Diagnostic probe — connects to the upstream Zapier MCP server, lists
 * every tool, and prints what would be exposed by zapier-mcp-proxy
 * under the current configuration.
 */

import { loadConfig } from "./config.js";
import { filterAndRename } from "./filter.js";
import { setLogLevel } from "./log.js";
import { UpstreamClient } from "./upstream.js";

async function main(): Promise<void> {
  const config = loadConfig();
  setLogLevel(config.logLevel);

  const upstream = new UpstreamClient(config);
  const tools = await upstream.listAllTools();
  const result = filterAndRename(tools, config);

  // eslint-disable-next-line no-console
  console.log(`\nUpstream Zapier MCP host: ${new URL(config.zapierMcpUrl).host}`);
  // eslint-disable-next-line no-console
  console.log(
    `Match terms: ${config.matchTerms.length > 0 ? config.matchTerms.join(", ") : "(none — pass-through)"}`,
  );
  // eslint-disable-next-line no-console
  console.log(`Tool prefix: "${config.toolPrefix}"`);
  // eslint-disable-next-line no-console
  console.log(`Keep meta tools: ${config.keepMetaTools}\n`);

  // eslint-disable-next-line no-console
  console.log(`Upstream advertises ${tools.length} tools total.`);
  // eslint-disable-next-line no-console
  console.log(
    `Of those, ${result.kept.length} would be exposed (${result.droppedCount} dropped).\n`,
  );

  if (result.kept.length > 0) {
    // eslint-disable-next-line no-console
    console.log("Exposed tools:");
    for (const m of result.kept) {
      const same = m.exposedName === m.upstreamName;
      // eslint-disable-next-line no-console
      console.log(`  - ${m.exposedName}${same ? "" : `  (upstream: ${m.upstreamName})`}`);
    }
  }

  if (result.droppedCount > 0) {
    // eslint-disable-next-line no-console
    console.log("\nDropped tools:");
    const exposedSet = new Set(result.kept.map((k) => k.upstreamName));
    for (const t of tools) {
      if (exposedSet.has(t.name)) continue;
      // eslint-disable-next-line no-console
      console.log(`  - ${t.name}`);
    }
  }

  await upstream.close();
}

main().catch((err) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`[zapier-mcp-proxy probe fatal] ${msg}\n`);
  process.exit(1);
});
