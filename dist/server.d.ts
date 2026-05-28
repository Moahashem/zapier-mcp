/**
 * MCP server bootstrap. Mirrors leadsimple-mcp's server.ts but with
 * the generic Zapier filter — defaults to passing every tool through.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Config } from "./config.js";
import { UpstreamClient } from "./upstream.js";
export interface BuiltServer {
    server: Server;
    upstream: UpstreamClient;
    toolCount: number;
}
export declare function buildServer(config: Config): Promise<BuiltServer>;
//# sourceMappingURL=server.d.ts.map