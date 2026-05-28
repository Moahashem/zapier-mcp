/**
 * MCP server bootstrap. Mirrors leadsimple-mcp's server.ts but with
 * the generic Zapier filter — defaults to passing every tool through.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { filterAndRename } from "./filter.js";
import { log } from "./log.js";
import { UpstreamClient } from "./upstream.js";
const SERVER_NAME = "zapier-mcp-proxy";
const SERVER_VERSION = "0.1.0";
export async function buildServer(config) {
    const upstream = new UpstreamClient(config);
    log.info("bootstrapping MCP server", {
        upstreamHost: new URL(config.zapierMcpUrl).host,
        matchTerms: config.matchTerms.length > 0 ? config.matchTerms : "(no filter)",
        toolPrefix: config.toolPrefix || "(none)",
        keepMetaTools: config.keepMetaTools,
    });
    const initialTools = await upstream.listAllTools();
    const initial = filterAndRename(initialTools, config);
    log.info(`discovered ${initialTools.length} upstream tools → ` +
        `${initial.kept.length} exposed (${initial.droppedCount} dropped, ` +
        `${initial.metaKeptCount} meta kept)`);
    if (initial.kept.length === 0) {
        log.warn("no tools exposed. Open https://mcp.zapier.com, pick your server, and " +
            "add actions on the Configure tab. (If you set ZAPIER_MATCH_TERMS, " +
            "try widening it.)");
    }
    let mappings = indexMappings(initial.kept);
    const server = new Server({ name: SERVER_NAME, version: SERVER_VERSION }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        try {
            const tools = await upstream.listAllTools();
            const result = filterAndRename(tools, config);
            mappings = indexMappings(result.kept);
            log.debug(`list_tools: ${result.kept.length} exposed (${result.droppedCount} dropped)`);
            return { tools: result.kept.map((m) => m.exposed) };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            log.error(`list_tools failed: ${msg}`);
            return { tools: Array.from(mappings.values()).map((m) => m.exposed) };
        }
    });
    server.setRequestHandler(CallToolRequestSchema, async (req) => {
        const { name, arguments: rawArgs } = req.params;
        const mapping = mappings.get(name);
        if (!mapping) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Unknown Zapier tool: ${name}. ` +
                            `If the action exists on https://mcp.zapier.com but isn't ` +
                            `appearing, check ZAPIER_MATCH_TERMS (currently filtering only ` +
                            `for: ${config.matchTerms.length > 0 ? config.matchTerms.join(", ") : "(no filter)"}).`,
                    },
                ],
                isError: true,
            };
        }
        try {
            const args = (rawArgs ?? {});
            return await upstream.callTool(mapping.upstreamName, args);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            log.warn(`tool call failed: ${name} → ${mapping.upstreamName} — ${msg}`);
            return {
                content: [
                    { type: "text", text: `Error invoking ${name} via Zapier MCP: ${msg}` },
                ],
                isError: true,
            };
        }
    });
    return { server, upstream, toolCount: initial.kept.length };
}
function indexMappings(kept) {
    const m = new Map();
    for (const k of kept)
        m.set(k.exposedName, k);
    return m;
}
//# sourceMappingURL=server.js.map