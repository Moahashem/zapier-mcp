# zapier-mcp

> Model Context Protocol server that proxies [Zapier MCP](https://mcp.zapier.com) over stdio with per-agent identity and optional tool filtering. Companion to [`leadsimple-mcp`](https://github.com/Moahashem/leadsimple-mcp) — same architecture, no app-specific filter.

## Why this exists

Zapier already ships a remote MCP server at `mcp.zapier.com`. So why a wrapper?

1. **Per-agent identity.** Each agent (Cowork, Claude Code, ClawBot) gets its own server URL → its own usage audit on Zapier → its own scoped action surface.
2. **Local stdio shape.** Some clients prefer to spawn a local stdio process and let it manage the connection upstream. This proxy makes that one-line.
3. **Optional filtering.** `ZAPIER_MATCH_TERMS=gmail,slack,sheets` narrows the agent's toolbox without re-configuring the upstream server.
4. **Optional renaming.** `ZAPIER_TOOL_PREFIX=zapier_` keeps tool names clearly tagged in the agent's UI.

If you only want LeadSimple actions, use [`leadsimple-mcp`](https://github.com/Moahashem/leadsimple-mcp) — it's the same proxy with a LeadSimple-shaped filter baked in.

## Quick start (per agent)

### 1. Get your Zapier MCP server URL

Open [mcp.zapier.com](https://mcp.zapier.com), create a server, add the actions you want this agent to have, then grab the URL from the Connect tab. It looks like `https://mcp.zapier.com/api/mcp/s/<long-token>/mcp` and contains an embedded token — treat it like a password.

### 2. Configure your agent

#### Claude Desktop / Cowork

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "zapier": {
      "command": "npx",
      "args": ["-y", "zapier-mcp-proxy"],
      "env": {
        "ZAPIER_MCP_URL": "https://mcp.zapier.com/api/mcp/s/..."
      }
    }
  }
}
```

#### Claude Code

```bash
claude mcp add zapier -- env ZAPIER_MCP_URL=https://mcp.zapier.com/api/mcp/s/... npx -y zapier-mcp-proxy
```

### 3. Try it

> *"Use Zapier to send a Slack message to #general saying we just shipped the LeadSimple MCP."*

## Configuration

| Env var | Required | Default | Purpose |
|---|---|---|---|
| `ZAPIER_MCP_URL` | yes | — | Your Zapier MCP server URL from `mcp.zapier.com`. |
| `ZAPIER_MATCH_TERMS` | no | `` (empty = pass-through) | Comma-separated substrings. Tool name OR description must contain at least one to be exposed. |
| `ZAPIER_TOOL_PREFIX` | no | `` | Prefix added to every exposed tool name. Set to `zapier_` for explicit tagging. |
| `ZAPIER_KEEP_META_TOOLS` | no | `true` | Whether to keep Zapier meta tools like `get_configuration_url`. Useful for self-service reconfiguration. |
| `ZAPIER_LOG_LEVEL` | no | `info` | `silent` \| `error` \| `warn` \| `info` \| `debug`. |
| `ZAPIER_TIMEOUT_MS` | no | `60000` | Per-request timeout against the upstream server. |

## Diagnostic probe

```bash
ZAPIER_MCP_URL=https://mcp.zapier.com/api/mcp/s/... npm run probe
```

Prints a side-by-side view of what the upstream server advertises vs. what would be exposed by this proxy under the current config.

## Development

```bash
git clone https://github.com/Moahashem/zapier-mcp.git
cd zapier-mcp
npm install
npm run typecheck
npm run build

ZAPIER_MCP_URL=https://mcp.zapier.com/api/mcp/s/... \
ZAPIER_LOG_LEVEL=debug \
npm run dev
```

## License

MIT — see [LICENSE](./LICENSE).
