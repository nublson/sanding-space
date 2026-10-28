import { createHash } from "node:crypto";
import {
  AUTHOR,
  absoluteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "../site";
import { A2A_SKILLS } from "./a2a";
import { AGENT_TOOLS, AGENT_VERSION } from "./tools";

/**
 * The discovery documents under /.well-known, built from the site URL so
 * previews describe themselves. Every one is public and read-only: nothing
 * here asks for credentials.
 */

const HOST = new URL(SITE_URL).host;
export const SKILL_NAME = "sanding-space";

/** MCP server card (SEP-1649), at /.well-known/mcp/server-card.json. */
export function mcpServerCard() {
  return {
    name: HOST,
    serverInfo: {
      name: HOST,
      title: `${SITE_NAME} MCP Server`,
      version: AGENT_VERSION,
      description: `Read-only access to ${SITE_NAME}: essays as Markdown, sections, live demos and resources.`,
    },
    transport: { type: "streamable-http", endpoint: absoluteUrl("/api/mcp") },
    capabilities: { tools: { listChanged: false } },
    tools: AGENT_TOOLS.map(({ name, description }) => ({ name, description })),
    authentication: { type: "none" },
    website: SITE_URL,
  };
}

/** A2A v1.0 agent card, at /.well-known/agent-card.json. */
export function a2aAgentCard() {
  return {
    name: `${SITE_NAME} Library Agent`,
    description: `Answers questions about ${SITE_NAME}'s essays, demos and resources. Read-only and public.`,
    supportedInterfaces: [
      {
        url: absoluteUrl("/api/a2a"),
        protocolBinding: "JSONRPC",
        protocolVersion: "1.0",
      },
    ],
    provider: { organization: SITE_NAME, url: SITE_URL },
    version: AGENT_VERSION,
    documentationUrl: absoluteUrl("/llms.txt"),
    // Synchronous Messages only: no tasks to stream or push.
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain", "text/markdown", "application/json"],
    skills: A2A_SKILLS,
  };
}

/** RFC 9727 API catalog, at /.well-known/api-catalog. */
export function apiCatalog() {
  return {
    linkset: [
      {
        anchor: absoluteUrl("/api/markdown"),
        "service-desc": [
          {
            href: absoluteUrl("/openapi.json"),
            type: "application/openapi+json",
          },
        ],
        "service-doc": [{ href: absoluteUrl("/llms.txt"), type: "text/plain" }],
      },
      {
        anchor: absoluteUrl("/api/oembed"),
        "service-desc": [
          {
            href: absoluteUrl("/openapi.json"),
            type: "application/openapi+json",
          },
        ],
      },
      {
        anchor: absoluteUrl("/api/mcp"),
        "service-desc": [
          {
            href: absoluteUrl("/.well-known/mcp/server-card.json"),
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: absoluteUrl(
              `/.well-known/agent-skills/${SKILL_NAME}/SKILL.md`,
            ),
            type: "text/markdown",
          },
        ],
      },
      {
        anchor: absoluteUrl("/api/a2a"),
        "service-desc": [
          {
            href: absoluteUrl("/.well-known/agent-card.json"),
            type: "application/json",
          },
        ],
      },
    ],
  };
}

/** Agent Resource Discovery manifest, at /.well-known/ard.json. */
export function ardManifest() {
  const entry = (
    id: string,
    displayName: string,
    description: string,
    type: string,
    path: string,
    tags: string[],
    representativeQueries: string[],
  ) => ({
    identifier: `urn:air:${HOST}:${id}`,
    displayName,
    description,
    type,
    url: absoluteUrl(path),
    tags,
    representativeQueries,
  });
  return {
    specVersion: "1.0",
    host: {
      displayName: SITE_NAME,
      identifier: `did:web:${HOST}`,
      documentationUrl: absoluteUrl("/llms.txt"),
    },
    entries: [
      entry(
        "mcp:library",
        `${SITE_NAME} MCP Server`,
        "Read-only MCP server over Streamable HTTP: list, search and read essays, demos and resources.",
        "application/mcp-server-card+json",
        "/.well-known/mcp/server-card.json",
        ["mcp", "essays", "read-only"],
        [
          "read Sanding Space essays as markdown",
          "search design engineering essays",
        ],
      ),
      entry(
        "a2a:library-agent",
        `${SITE_NAME} Library Agent`,
        "A2A v1.0 agent card for the JSON-RPC endpoint at /api/a2a.",
        "application/a2a-agent-card+json",
        "/.well-known/agent-card.json",
        ["a2a", "agent-card", "jsonrpc"],
        ["ask Sanding Space about its essays over A2A"],
      ),
      entry(
        "skills:index",
        `${SITE_NAME} Agent Skills`,
        "How to read the essays as Markdown and embed the demos.",
        "application/agent-skills+json",
        "/.well-known/agent-skills/index.json",
        ["agent-skills", "markdown", "embed"],
        [
          "how do I embed a Sanding Space demo",
          "fetch a Sanding Space essay as markdown",
        ],
      ),
      entry(
        "api:content",
        `${SITE_NAME} Content API`,
        "OpenAPI 3.1 description of the public endpoints: pages as Markdown and oEmbed.",
        "application/openapi+json",
        "/openapi.json",
        ["openapi", "oembed", "read-only"],
        ["oEmbed endpoint for Sanding Space demos"],
      ),
      entry(
        "docs:llms",
        `${SITE_NAME} llms.txt`,
        "Every section and essay with its URL and summary.",
        "text/plain",
        "/llms.txt",
        ["llms-txt", "index"],
        ["list everything published on Sanding Space"],
      ),
    ],
  };
}

/** The agent skill (agentskills.io): a SKILL.md for reading and embedding the site. */
export function skillMd(): string {
  const url = (path: string) => absoluteUrl(path);
  return `---
name: ${SKILL_NAME}
description: Read ${SITE_NAME} essays on design engineering and product engineering as Markdown, and embed its live demos.
---

# Reading ${SITE_NAME}

${SITE_NAME} (${HOST}) is a library of short essays about design engineering
and product engineering by ${AUTHOR.name}. Every essay has live, interactive
demos, and every demo has a permanent, embeddable URL. Everything is public;
no authentication is required anywhere.

## Find things

- \`${url("/llms.txt")}\` lists every section and essay with its URL and
  summary. Start here for slugs. Essays marked "(coming soon)" have no page yet.
- \`${url("/sitemap.xml")}\` lists every page and live demo.

## Read a page

Request any page with \`Accept: text/markdown\` and it comes back as Markdown
instead of HTML: \`/introduction\`, \`/about\`, \`/resources\`,
\`/sections/{slug}\` and \`/{essay-slug}\`. Essays start with YAML front matter
(title, description, section, url, published, updated, author). Responses
carry an \`x-markdown-tokens\` size estimate.

## Tools

- MCP (Streamable HTTP): \`${url("/api/mcp")}\`, read-only tools
  ${AGENT_TOOLS.map((t) => `\`${t.name}\``).join(", ")}.
  Server card: \`${url("/.well-known/mcp/server-card.json")}\`.
- A2A v1.0 (JSON-RPC): \`${url("/api/a2a")}\`, same skills.
  Agent card: \`${url("/.well-known/agent-card.json")}\`.

## Embed a demo

Demos live at \`${url("/demos/{name}")}\`; the names are permanent (renamed
demos redirect). Get the embed code from oEmbed:
\`${url("/api/oembed")}?url=${url("/demos/{name}")}\`. It is an iframe plus
\`${url("/embed.js")}\`, which keeps the frame's height in sync. Query
parameters on the demo URL become the demo's props; \`theme\` (light, dark, system)
and \`bg=transparent\` style the frame.

## Conventions

- Link to essays by their URL; cite ${SITE_NAME} and ${AUTHOR.name}.
- Usage preferences are declared in \`/robots.txt\` with Content-Signal.
- Content comes from a CMS and is cached for a few minutes.
`;
}

export function agentSkillsIndex() {
  const digest = createHash("sha256").update(skillMd()).digest("hex");
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: SKILL_NAME,
        type: "skill-md",
        description: `Read ${SITE_NAME} essays as Markdown and embed its live demos.`,
        url: absoluteUrl(`/.well-known/agent-skills/${SKILL_NAME}/SKILL.md`),
        digest: `sha256:${digest}`,
      },
    ],
  };
}

/** OpenAPI 3.1 for the plain-HTTP endpoints. */
export function openApi() {
  const markdown = {
    "text/markdown": { schema: { type: "string" } },
  };
  return {
    openapi: "3.1.0",
    info: {
      title: `${SITE_NAME} Content API`,
      version: AGENT_VERSION,
      description: `${SITE_DESCRIPTION} Public and read-only; no authentication.`,
    },
    servers: [{ url: SITE_URL }],
    paths: {
      "/{path}": {
        get: {
          operationId: "getPageMarkdown",
          summary:
            "A page as Markdown: send Accept: text/markdown to any page URL.",
          parameters: [
            {
              name: "path",
              in: "path",
              required: true,
              description:
                "An essay slug, sections/{slug}, introduction, about or resources.",
              schema: { type: "string" },
            },
            {
              name: "Accept",
              in: "header",
              required: true,
              schema: { type: "string", const: "text/markdown" },
            },
          ],
          responses: {
            "200": { description: "The page as Markdown.", content: markdown },
            "404": { description: "No such page.", content: markdown },
          },
        },
      },
      "/llms.txt": {
        get: {
          operationId: "getLlmsTxt",
          summary: "Every section and essay with its URL and summary.",
          responses: {
            "200": {
              description: "llms.txt",
              content: { "text/plain": { schema: { type: "string" } } },
            },
          },
        },
      },
      "/api/oembed": {
        get: {
          operationId: "getOembed",
          summary: "oEmbed for an essay or demo URL.",
          parameters: [
            {
              name: "url",
              in: "query",
              required: true,
              schema: { type: "string", format: "uri" },
            },
            {
              name: "maxwidth",
              in: "query",
              schema: { type: "integer", minimum: 1 },
            },
            {
              name: "maxheight",
              in: "query",
              schema: { type: "integer", minimum: 1 },
            },
            {
              name: "format",
              in: "query",
              schema: { type: "string", enum: ["json"] },
            },
          ],
          responses: {
            "200": {
              description: "An oEmbed rich (demo) or link (essay) response.",
              content: { "application/json": { schema: { type: "object" } } },
            },
            "404": { description: "Not a page on this site." },
          },
        },
      },
    },
  };
}
