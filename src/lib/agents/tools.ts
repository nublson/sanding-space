/**
 * The read-only tools every agent protocol exposes (MCP, A2A), under the same
 * names, so the server card, agent card and skill tell one story.
 */
export const AGENT_TOOLS = [
  {
    name: "list_essays",
    title: "List essays",
    description:
      "List every essay by section, in reading order, with its slug, URL, summary and demo. Coming-soon essays are listed without a URL.",
  },
  {
    name: "search_essays",
    title: "Search essays",
    description:
      "Case-insensitive search across essay titles, summaries and section names.",
  },
  {
    name: "get_page",
    title: "Get page",
    description:
      "Read a page as Markdown by its path: an essay slug ('button-press'), a section ('sections/motion'), 'introduction', 'about' or 'resources'.",
  },
  {
    name: "list_demos",
    title: "List demos",
    description:
      "List the live demos with their permanent URL, the essay that explains them and their embed code.",
  },
  {
    name: "list_resources",
    title: "List resources",
    description:
      "List the tools and references on the Resources page, by category, with URL and description.",
  },
] as const;

export type AgentToolName = (typeof AGENT_TOOLS)[number]["name"];

export function agentTool(name: AgentToolName) {
  return AGENT_TOOLS.find(
    (tool) => tool.name === name,
  ) as (typeof AGENT_TOOLS)[number];
}

export const AGENT_VERSION = "1.0.0";
