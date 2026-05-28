/**
 * Upstream MCP client — connects to the Zapier MCP server over
 * Streamable HTTP and exposes listTools / callTool to the proxy.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { log } from "./log.js";
const CLIENT_NAME = "zapier-mcp-proxy";
const CLIENT_VERSION = "0.1.0";
export class UpstreamClient {
    config;
    client;
    transport;
    connected = false;
    constructor(config) {
        this.config = config;
        this.client = new Client({ name: CLIENT_NAME, version: CLIENT_VERSION }, { capabilities: {} });
        this.transport = new StreamableHTTPClientTransport(new URL(this.config.zapierMcpUrl));
    }
    async connect() {
        if (this.connected)
            return;
        log.debug("connecting to upstream Zapier MCP", {
            host: new URL(this.config.zapierMcpUrl).host,
        });
        await this.client.connect(this.transport);
        this.connected = true;
        log.info("upstream Zapier MCP connected");
    }
    async close() {
        if (!this.connected)
            return;
        try {
            await this.client.close();
        }
        catch (err) {
            log.warn("error closing upstream", asError(err));
        }
        finally {
            this.connected = false;
        }
    }
    async listAllTools() {
        await this.connect();
        const collected = [];
        let cursor;
        do {
            const res = await withTimeout(this.client.listTools({ cursor }), this.config.timeoutMs, "listTools");
            for (const t of res.tools)
                collected.push(t);
            cursor = res.nextCursor ?? undefined;
        } while (cursor);
        log.debug(`upstream listed ${collected.length} tools`);
        return collected;
    }
    async callTool(upstreamName, args) {
        await this.connect();
        log.debug(`calling upstream tool: ${upstreamName}`, args);
        const result = (await withTimeout(this.client.callTool({ name: upstreamName, arguments: args }), this.config.timeoutMs, `callTool(${upstreamName})`));
        return result;
    }
}
function asError(err) {
    return { message: err instanceof Error ? err.message : String(err) };
}
function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`[zapier-mcp] upstream timeout after ${ms}ms: ${label}`));
        }, ms);
        promise.then((v) => {
            clearTimeout(timer);
            resolve(v);
        }, (e) => {
            clearTimeout(timer);
            reject(e);
        });
    });
}
//# sourceMappingURL=upstream.js.map