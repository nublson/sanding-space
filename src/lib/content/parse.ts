import type { PageObjectResponse } from "@notionhq/client";
import { normalizePageId } from "notionic";
import type { Essay, EssayStatus, Section } from "./types";

type Props = PageObjectResponse["properties"];
type Prop = Props[string];
type Of<T extends Prop["type"]> = Extract<Prop, { type: T }>;

function prop<T extends Prop["type"]>(
  props: Props,
  name: string,
  type: T,
): Of<T> | null {
  const p = props[name];
  return p && p.type === type ? (p as Of<T>) : null;
}

const plain = (items: { plain_text: string }[] | undefined) =>
  (items ?? []).map((t) => t.plain_text).join("");

const text = (props: Props, name: string) =>
  plain(prop(props, name, "rich_text")?.rich_text).trim();

const title = (props: Props, name: string) =>
  plain(prop(props, name, "title")?.title).trim();

const num = (props: Props, name: string) =>
  prop(props, name, "number")?.number ?? Number.POSITIVE_INFINITY;

const relation = (props: Props, name: string) =>
  (prop(props, name, "relation")?.relation ?? []).map((r) =>
    normalizePageId(r.id),
  );

export function parseSection(page: PageObjectResponse): Section {
  const p = page.properties;
  return {
    id: normalizePageId(page.id),
    slug: text(p, "Slug"),
    name: title(p, "Name"),
    question: text(p, "Question"),
    order: num(p, "Order"),
    visible: prop(p, "Visible", "checkbox")?.checkbox ?? false,
  };
}

const STATUSES: readonly EssayStatus[] = ["Published", "Soon", "Draft"];

export function parseEssay(page: PageObjectResponse): Essay {
  const p = page.properties;
  const status = prop(p, "Status", "status")?.status?.name;
  return {
    id: normalizePageId(page.id),
    slug: text(p, "Slug"),
    title: title(p, "Title"),
    summary: text(p, "Summary"),
    status: STATUSES.find((s) => s === status) ?? "Draft",
    order: num(p, "Order"),
    sectionId: relation(p, "Section")[0] ?? null,
    coverDemo: text(p, "Cover demo") || null,
    tags: (prop(p, "Tags", "multi_select")?.multi_select ?? []).map(
      (t) => t.name,
    ),
    published: prop(p, "Published", "date")?.date?.start ?? null,
    updated:
      prop(p, "Updated", "last_edited_time")?.last_edited_time ??
      page.last_edited_time,
    relatedIds: relation(p, "Related"),
  };
}
