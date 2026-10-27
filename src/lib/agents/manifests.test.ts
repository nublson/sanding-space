import { createHash } from "node:crypto";
import { absoluteUrl } from "../site";
import {
  a2aAgentCard,
  agentSkillsIndex,
  apiCatalog,
  ardManifest,
  mcpServerCard,
  SKILL_NAME,
  skillMd,
} from "./manifests";
import { AGENT_TOOLS } from "./tools";

test("the skills index points at SKILL.md with its real digest", () => {
  const [skill] = agentSkillsIndex().skills;
  expect(skill.url).toBe(
    absoluteUrl(`/.well-known/agent-skills/${SKILL_NAME}/SKILL.md`),
  );
  const digest = createHash("sha256").update(skillMd()).digest("hex");
  expect(skill.digest).toBe(`sha256:${digest}`);
  expect(skillMd()).toMatch(
    new RegExp(`^---\\nname: ${SKILL_NAME}\\ndescription: .+\\n---\\n`),
  );
});

test("the MCP server card lists the tools and the endpoint, without auth", () => {
  const card = mcpServerCard();
  expect(card.transport.endpoint).toBe(absoluteUrl("/api/mcp"));
  expect(card.tools.map((t) => t.name)).toEqual(AGENT_TOOLS.map((t) => t.name));
  expect(card.authentication).toEqual({ type: "none" });
});

test("the A2A card describes the JSON-RPC endpoint truthfully", () => {
  const card = a2aAgentCard();
  expect(card.supportedInterfaces).toEqual([
    {
      url: absoluteUrl("/api/a2a"),
      protocolBinding: "JSONRPC",
      protocolVersion: "1.0",
    },
  ]);
  expect(card.capabilities).toEqual({
    streaming: false,
    pushNotifications: false,
  });
});

test("the catalogs only point at surfaces that exist", () => {
  const known = [
    "/api/markdown",
    "/api/oembed",
    "/api/mcp",
    "/api/a2a",
    "/openapi.json",
    "/llms.txt",
    "/.well-known/mcp/server-card.json",
    "/.well-known/agent-card.json",
    "/.well-known/agent-skills/index.json",
    `/.well-known/agent-skills/${SKILL_NAME}/SKILL.md`,
  ].map(absoluteUrl);
  const hrefs = apiCatalog().linkset.flatMap((entry) => [
    entry.anchor,
    ...[...(entry["service-desc"] ?? []), ...(entry["service-doc"] ?? [])].map(
      (l) => l.href,
    ),
  ]);
  const urls = ardManifest().entries.map((e) => e.url);
  for (const url of [...hrefs, ...urls]) expect(known).toContain(url);
});
