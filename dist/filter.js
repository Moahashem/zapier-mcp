/**
 * Generic Zapier proxy filter + renamer.
 *
 * Unlike leadsimple-mcp's filter, this one defaults to passing
 * everything through. Set ZAPIER_MATCH_TERMS to narrow the surface
 * down to specific apps (e.g. "gmail,slack,sheets") — useful for
 * giving an agent a focused toolbox without rebuilding the server.
 */
import { META_TOOL_SET } from "./config.js";
export function filterAndRename(upstream, config) {
    const kept = [];
    const seenExposed = new Set();
    let droppedCount = 0;
    let metaKeptCount = 0;
    for (const tool of upstream) {
        const isMeta = META_TOOL_SET.has(tool.name);
        // Apply substring filter only if configured. Empty match list = pass-through.
        let keep = config.matchTerms.length === 0 || matchesTerms(tool, config.matchTerms);
        if (!keep) {
            if (isMeta && config.keepMetaTools) {
                metaKeptCount++;
                keep = true;
            }
            else {
                droppedCount++;
                continue;
            }
        }
        else if (isMeta && !config.keepMetaTools) {
            // explicitly drop meta tools when keepMetaTools=false even if they match
            droppedCount++;
            continue;
        }
        const exposedName = renameTool(tool.name, config.toolPrefix, seenExposed);
        seenExposed.add(exposedName);
        kept.push({
            exposedName,
            upstreamName: tool.name,
            exposed: { ...tool, name: exposedName },
        });
    }
    return { kept, droppedCount, metaKeptCount };
}
function matchesTerms(tool, terms) {
    const hay = `${tool.name} ${tool.description ?? ""}`.toLowerCase();
    for (const term of terms) {
        if (hay.includes(term))
            return true;
    }
    return false;
}
function renameTool(upstreamName, prefix, taken) {
    if (prefix.length === 0)
        return uniqueify(upstreamName, taken);
    const lowerName = upstreamName.toLowerCase();
    const lowerPrefix = prefix.toLowerCase();
    if (lowerName.startsWith(lowerPrefix))
        return uniqueify(upstreamName, taken);
    return uniqueify(`${prefix}${upstreamName}`, taken);
}
function uniqueify(name, taken) {
    if (!taken.has(name))
        return name;
    for (let i = 2; i < 1000; i++) {
        const candidate = `${name}_${i}`;
        if (!taken.has(candidate))
            return candidate;
    }
    return `${name}_dup`;
}
//# sourceMappingURL=filter.js.map