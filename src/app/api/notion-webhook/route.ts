import { revalidateTag } from "next/cache";
import {
  affectsContent,
  NOTION_SIGNATURE_HEADER,
  parseNotionWebhook,
  verifyNotionSignature,
} from "@/lib/notion-webhook";

/**
 * Notion calls this when the library changes. The first call is the
 * verification handshake, which is logged so the token can be pasted into
 * Notion and stored as NOTION_WEBHOOK_SECRET; every later call is checked
 * against that secret and refreshes everything cached under the `notion` tag.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const message = parseNotionWebhook(body);

  if (message.kind === "invalid") {
    return Response.json({ error: "Unrecognised payload" }, { status: 400 });
  }

  if (message.kind === "verification") {
    console.info(
      `[notion-webhook] verification token received: ${message.token}. Paste it into the Notion integration's Webhooks tab and set NOTION_WEBHOOK_SECRET to it.`,
    );
    return Response.json({ received: true });
  }

  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: "NOTION_WEBHOOK_SECRET is not set" },
      { status: 503 },
    );
  }
  if (
    !verifyNotionSignature(
      body,
      request.headers.get(NOTION_SIGNATURE_HEADER),
      secret,
    )
  ) {
    return Response.json({ error: "Bad signature" }, { status: 401 });
  }

  const revalidated = affectsContent(message.type);
  if (revalidated) revalidateTag("notion", "max");
  return Response.json({ revalidated, type: message.type });
}
