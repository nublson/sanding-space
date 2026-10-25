import type { Essay, Section } from "@/lib/content/types";
import type { DemoMeta } from "@/lib/demo-meta";
import { RESERVED_SLUGS } from "@/lib/reserved";

export type CheckInput = {
  sections: Section[];
  essays: Essay[];
  embedsByEssay: Record<string, string[]>;
  demos: Record<string, DemoMeta>;
};

export type CheckResult = { errors: string[]; warnings: string[] };

const essayLabel = (e: Essay) => e.slug || `"${e.title}"`;
const sectionLabel = (s: Section) => s.slug || `"${s.name}"`;

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dupes.add(v);
    seen.add(v);
  }
  return [...dupes];
}

export function checkContent(input: CheckInput): CheckResult {
  const { sections, essays, embedsByEssay, demos } = input;
  const errors: string[] = [];
  const warnings: string[] = [];

  const known = new Set<string>(Object.keys(demos));
  for (const d of Object.values(demos))
    for (const a of d.aliases ?? []) known.add(a);
  const live = essays.filter((e) => e.status !== "Draft");

  // 1. embeds exist
  for (const e of live) {
    for (const name of embedsByEssay[e.id] ?? []) {
      if (!known.has(name))
        errors.push(
          `[rule 1] essay ${essayLabel(e)} embeds unknown demo "${name}"`,
        );
    }
  }

  // 2. cover demos exist
  for (const e of essays) {
    if (e.coverDemo && !known.has(e.coverDemo))
      errors.push(
        `[rule 2] essay ${essayLabel(e)} has unknown Cover demo "${e.coverDemo}"`,
      );
  }

  // 3. essay slugs unique, not reserved, not blank
  for (const e of live) {
    if (!e.slug) {
      errors.push(`[rule 3] essay ${essayLabel(e)} has a blank slug`);
      continue;
    }
    if (RESERVED_SLUGS.includes(e.slug))
      errors.push(`[rule 3] essay ${e.slug} uses a reserved slug`);
  }
  for (const slug of duplicates(live.filter((e) => e.slug).map((e) => e.slug)))
    errors.push(`[rule 3] essay slug ${slug} is used more than once`);

  // 4. section slugs unique
  for (const slug of duplicates(sections.map((s) => s.slug)))
    errors.push(
      `[rule 4] section slug ${sectionLabel({ slug, name: slug } as Section)} is used more than once`,
    );

  // 5. exactly one existing section
  const sectionIds = new Set(sections.map((s) => s.id));
  for (const e of live) {
    if (!e.sectionId)
      errors.push(`[rule 5] essay ${essayLabel(e)} has no Section`);
    else if (!sectionIds.has(e.sectionId))
      errors.push(
        `[rule 5] essay ${essayLabel(e)} points to an unknown Section`,
      );
  }

  // 6. demo names and aliases don't collide
  const claims = new Map<string, number>();
  for (const [name, d] of Object.entries(demos)) {
    for (const n of new Set([name, ...(d.aliases ?? [])]))
      claims.set(n, (claims.get(n) ?? 0) + 1);
  }
  for (const [n, count] of claims)
    if (count > 1)
      errors.push(`[rule 6] demo name or alias "${n}" is used more than once`);

  // 7. registry essay points to a real non-Draft essay
  const bySlug = new Map(essays.filter((e) => e.slug).map((e) => [e.slug, e]));
  for (const [name, d] of Object.entries(demos)) {
    const target = bySlug.get(d.essay);
    if (!target || target.status === "Draft")
      errors.push(
        `[rule 7] demo ${name} points to essay "${d.essay}", which is missing or Draft`,
      );
    else if (target.status === "Soon")
      warnings.push(
        `[rule 7] demo ${name} points to essay "${d.essay}", which is still Soon`,
      );
  }

  return { errors, warnings };
}
