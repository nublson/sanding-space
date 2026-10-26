import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Notion webhook protocol (developers.notion.com/reference/webhooks).
 *
 * When a subscription is created Notion POSTs `{ "verification_token": "secret_…" }`
 * once; that token is pasted back into Notion to verify the subscription and is
 * then the HMAC key for every later event, sent as
 * `X-Notion-Signature: sha256=<hex of HMAC-SHA256(raw body)>`.
 */

export const NOTION_SIGNATURE_HEADER = "x-notion-signature";

export type NotionWebhookMessage =
  | { kind: "verification"; token: string }
  | { kind: "event"; type: string; entityId: string | null }
  | { kind: "invalid" };

/** Signs a raw body the way Notion does, for comparison and for tests. */
export function signNotionWebhook(body: string, token: string): string {
  return `sha256=${createHmac("sha256", token).update(body).digest("hex")}`;
}

/** Constant-time check of the `X-Notion-Signature` header against the raw body. */
export function verifyNotionSignature(
  body: string,
  header: string | null,
  token: string,
): boolean {
  if (!header) return false;
  const expected = Buffer.from(signNotionWebhook(body, token));
  const received = Buffer.from(header);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

/** Classifies a raw webhook body without trusting any of its fields. */
export function parseNotionWebhook(body: string): NotionWebhookMessage {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return { kind: "invalid" };
  }
  if (!json || typeof json !== "object") return { kind: "invalid" };
  const record = json as Record<string, unknown>;
  if (typeof record.verification_token === "string") {
    return { kind: "verification", token: record.verification_token };
  }
  if (typeof record.type === "string") {
    const entity = record.entity as Record<string, unknown> | undefined;
    const entityId = typeof entity?.id === "string" ? entity.id : null;
    return { kind: "event", type: record.type, entityId };
  }
  return { kind: "invalid" };
}

/**
 * Only page, data source and (legacy) database events can change what the site
 * renders; comment events never do.
 */
export function affectsContent(type: string): boolean {
  return /^(page|data_source|database)\./.test(type);
}
