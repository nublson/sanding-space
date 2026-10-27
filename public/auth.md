# auth.md

Authentication and registration policy for autonomous agents and MCP clients
reading sanding.space.

Sanding Space is an **open, read-only library**. Every agent-facing surface is
public. There is no authorization server, no token endpoint and nothing to
register for. This document says so, so an agent can learn it from a file
instead of inferring it from a 404.

## Audience

Autonomous agents, MCP and A2A clients, and crawlers that want to read the
essays, find the demos or embed them.

## Registration

**No registration is required, and no registration endpoint exists.**

This is deliberate. The essays and demos are already served to anonymous
browsers, so gating them behind an agent identity would add a credential
exchange without protecting anything. Agents go straight to the surfaces below.

## Authentication methods

| Method | Supported | Notes |
|---|---|---|
| Anonymous HTTP | Yes | The only method. Send no `Authorization` header. |
| OAuth 2.0 / OIDC | No | No authorization server runs for this domain. |
| API keys | No | None are issued and none are accepted. |
| mTLS | No | Not configured. |

## Credentials

The site issues no credentials and **accepts none**. An `Authorization` header,
bearer token or API key sent to any endpoint is ignored, not validated: it
grants no extra access, and leaving it out denies none. With nothing protected,
there is nothing to claim, rotate or revoke.

## Agent-facing surfaces

All public, none needs credentials:

| Surface | Path |
|---|---|
| Any page as Markdown | `Accept: text/markdown` on the page URL |
| Content index for LLMs | `/llms.txt` |
| MCP server (Streamable HTTP) | `/api/mcp` |
| MCP server card | `/.well-known/mcp/server-card.json` |
| A2A endpoint (JSON-RPC, v1.0) | `/api/a2a` |
| A2A agent card | `/.well-known/agent-card.json` |
| Agent skills index | `/.well-known/agent-skills/index.json` |
| ARD capability manifest | `/.well-known/ard.json` |
| API catalog | `/.well-known/api-catalog` |
| OpenAPI description | `/openapi.json` |
| oEmbed | `/api/oembed?url={page or demo URL}` |
| Embeddable demos | `/demos/{name}` |

## Acceptable use

Reading, quoting and embedding are welcome; `/robots.txt` declares the content
signals that apply, and the About page says what you may do with the demos.
Identify your agent with a descriptive `User-Agent` and keep request rates
reasonable.

## Contact

Reach the author through the links on `https://sanding.space/about`.
