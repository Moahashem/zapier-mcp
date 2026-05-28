/**
 * Upstream MCP client — connects to the Zapier MCP server over
 * Streamable HTTP and exposes listTools / callTool to the proxy.
 */
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import type { Config } from "./config.js";
export declare class UpstreamClient {
    private readonly config;
    private client;
    private transport;
    private connected;
    constructor(config: Config);
    connect(): Promise<void>;
    close(): Promise<void>;
    listAllTools(): Promise<Tool[]>;
    callTool(upstreamName: string, args: Record<string, unknown>): Promise<CallToolResult>;
}
//# sourceMappingURL=upstream.d.ts.map