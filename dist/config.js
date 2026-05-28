/**
 * Runtime configuration loaded from environment variables.
 *
 * Each agent (Claude Desktop, Cowork, Claude Code, ClawBot) sets its
 * own ZAPIER_MCP_URL so usage is attributed per-agent and different
 * agents can have different action surfaces.
 */
const VALID_LOG_LEVELS = [
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
export const META_TOOL_SET = META_TOOL_NAMES;
function requireEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`[zapier-mcp] Missing required environment variable: ${name}. ` +
            `See .env.example for setup. Get your URL at https://mcp.zapier.com.`);
    }
    return value.trim();
}
function parseBool(value, fallback) {
    if (value === undefined)
        return fallback;
    return value.trim().toLowerCase() === "true";
}
function parseLogLevel(value) {
    if (!value)
        return "info";
    const lower = value.trim().toLowerCase();
    return VALID_LOG_LEVELS.includes(lower) ? lower : "info";
}
function parseTimeout(value) {
    if (!value)
        return 60_000;
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : 60_000;
}
function parseMatchTerms(raw) {
    if (!raw)
        return [];
    return raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
}
export function loadConfig() {
    const zapierMcpUrl = requireEnv("ZAPIER_MCP_URL");
    if (!/^https:\/\//i.test(zapierMcpUrl)) {
        throw new Error(`[zapier-mcp] ZAPIER_MCP_URL must be an https:// URL. Got: ${zapierMcpUrl}`);
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
//# sourceMappingURL=config.js.map