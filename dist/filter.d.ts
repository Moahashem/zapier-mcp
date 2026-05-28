/**
 * Generic Zapier proxy filter + renamer.
 *
 * Unlike leadsimple-mcp's filter, this one defaults to passing
 * everything through. Set ZAPIER_MATCH_TERMS to narrow the surface
 * down to specific apps (e.g. "gmail,slack,sheets") — useful for
 * giving an agent a focused toolbox without rebuilding the server.
 */
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { type Config } from "./config.js";
export interface ToolMapping {
    exposedName: string;
    upstreamName: string;
    exposed: Tool;
}
export declare function filterAndRename(upstream: Tool[], config: Config): {
    kept: ToolMapping[];
    droppedCount: number;
    metaKeptCount: number;
};
//# sourceMappingURL=filter.d.ts.map