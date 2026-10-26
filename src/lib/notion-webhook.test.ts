import {
  affectsContent,
  parseNotionWebhook,
  signNotionWebhook,
  verifyNotionSignature,
} from "./notion-webhook";

const token = "test-verification-token";
const event = JSON.stringify({
  id: "367cba44-b6f3-4c92-81e7-6a2e9659efd4",
  timestamp: "2026-10-26T10:00:00.000Z",
  type: "page.content_updated",
  entity: { id: "153104cd-477e-809d-8dc4-ff2d96ae3090", type: "page" },
  data: { updated_blocks: [] },
});

describe("verifyNotionSignature", () => {
  it("accepts the HMAC-SHA256 of the raw body keyed by the verification token", () => {
    const header = signNotionWebhook(event, token);
    expect(header).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(verifyNotionSignature(event, header, token)).toBe(true);
  });

  it("rejects a missing, malformed, foreign or stale signature", () => {
    const header = signNotionWebhook(event, token);
    expect(verifyNotionSignature(event, null, token)).toBe(false);
    expect(verifyNotionSignature(event, "sha256=abc", token)).toBe(false);
    expect(verifyNotionSignature(event, header, "other-token")).toBe(false);
    expect(verifyNotionSignature(`${event} `, header, token)).toBe(false);
  });
});

describe("parseNotionWebhook", () => {
  it("recognises the one-time verification handshake", () => {
    expect(
      parseNotionWebhook(JSON.stringify({ verification_token: token })),
    ).toEqual({ kind: "verification", token });
  });

  it("recognises an event and its entity", () => {
    expect(parseNotionWebhook(event)).toEqual({
      kind: "event",
      type: "page.content_updated",
      entityId: "153104cd-477e-809d-8dc4-ff2d96ae3090",
    });
  });

  it("treats anything else as invalid", () => {
    expect(parseNotionWebhook("not json")).toEqual({ kind: "invalid" });
    expect(parseNotionWebhook("null")).toEqual({ kind: "invalid" });
    expect(parseNotionWebhook("{}")).toEqual({ kind: "invalid" });
    expect(parseNotionWebhook('{"type":1}')).toEqual({ kind: "invalid" });
  });
});

describe("affectsContent", () => {
  it("is true for page, data source and database events", () => {
    for (const type of [
      "page.content_updated",
      "page.properties_updated",
      "page.created",
      "page.deleted",
      "data_source.content_updated",
      "data_source.schema_updated",
      "database.content_updated",
    ])
      expect(affectsContent(type)).toBe(true);
  });

  it("is false for comment events", () => {
    expect(affectsContent("comment.created")).toBe(false);
    expect(affectsContent("comment.deleted")).toBe(false);
  });
});
