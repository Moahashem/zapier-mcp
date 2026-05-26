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

const VALID_LOG_LEVELS: ReadonlyArray<LogLevel> = [
  "silent",
  "error",
  "warn",
  "info",
  "debug",
];

// Zapier's MCP server exposes a meta-tool API that the agent uses to
// discover, enable, and execute actions across any of the 8,000+ connected
// apps. These 14 tools are the load-bearing surface — keepMetaTools is
// true by default for this generic proxy so the agent retains the ability
// to operate on any enabled action.
const META_TOOL_NAMES = new Set([
  "discover_zapier_actions",
  "enable_zapier_action",
  "disable_zapier_action",
  "list_enabled_zapier_actions",
  "execute_zapier_read_action",
  "execute_zapier_write_action",
  "send_feedback",
  "auto_provision_mcp",
  "list_zapier_skills",
  "get_zapier_skill",
  "create_zapier_skill",
  "update_zapier_skill",
  "delete_zapier_skill",
  "get_configuration_url",
]);

export const META_TOOL_SET: ReadonlySet<string> = META_TOOL_NAMES;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[zapier-mcp] Missing required environment variable: ${name}. ` +
        `See .env.example for setup. Get your URL at https://mcp.zapier.com.`,
    );
  }
  return value.trim();
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === "true";
}

function parseLogLevel(value: string | undefined): LogLevel {
  if (!value) return "info";
  const lower = value.trim().toLowerCase() as LogLevel;
  return VALID_LOG_LEVELS.includes(lower) ? lower : "info";
}

function parseTimeout(value: string | undefined): number {
  if (!value) return 60_000;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 60_000;
}

function parseMatchTerms(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

export function loadConfig(): Config {
  const zapierMcpUrl = requireEnv("ZAPIER_MCP_URL");
  if (!/^https:\/\//i.test(zapierMcpUrl)) {
    throw new Error(
      `[zapier-mcp] ZAPIER_MCP_URL must be an https:// URL. Got: ${zapierMcpUrl}`,
    );
  }
  return {
    zapierMcpUrl,
    matchTerms: parseMatchTerms(process.env.ZAPIER_MATCH_TERMS),
    keepMetaTools: parseBool(process.env.ZAPIER_KEEP_META_TOOLS, true),
    toolPrefix: process.env.ZAPIER_TOOL_PREFIX ?? "",
    logLevel: parseLogLevel(process.env.ZAPIER_LOG_LEVEL),
    timeoutMs: parseTimeout(process.env.ZAPIER_TIMEOUT_MS),
  };
}
