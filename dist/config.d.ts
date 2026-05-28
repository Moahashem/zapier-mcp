/**
 * Runtime configuration loaded from environment variables.
 *
 * Each agent (Claude Desktop, Cowork, Claude Code, ClawBot) sets its
 * own ZAPIER_MCP_URL so usage is attributed per-agent and different
 * agents can have different action surfaces.
 */
export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";
export interface Config {
    /** Upstream Zapier MCP server URL (Streamable HTTP). */
    zapierMcpUrl: string;
    /** Optional substring filter terms (lowercased). Empty array = no filter. */
    matchTerms: string[];
    /** Whether to keep Zapier meta tools. Default true for this generic proxy. */
    keepMetaTools: boolean;
    /** Optional prefix added to exposed tool names. Empty by default. */
    toolPrefix: string;
    /** Log level. */
    logLevel: LogLevel;
    /** Per-request timeout in ms. */
    timeoutMs: number;
}
export declare const META_TOOL_SET: ReadonlySet<string>;
export declare function loadConfig(): Config;
//# sourceMappingURL=config.d.ts.map