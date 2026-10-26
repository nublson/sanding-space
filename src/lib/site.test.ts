import {
  pageMetadata,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  showPreviews,
  title,
} from "./site";

test("title formats page names", () => {
  expect(SITE_NAME).toBe("Sanding Space");
  expect(title("Button Press")).toBe("Button Press · Sanding Space");
  expect(title()).toBe("Sanding Space");
});

test("previews show everywhere except Vercel production", () => {
  expect(showPreviews({ VERCEL_ENV: "production" })).toBe(false);
  expect(showPreviews({ VERCEL_ENV: "preview" })).toBe(true);
  expect(showPreviews({ VERCEL_ENV: "development" })).toBe(true);
  expect(showPreviews({})).toBe(true);
});

test("pageMetadata carries title, canonical and the same Open Graph copy", () => {
  const meta = pageMetadata({
    name: "Button Press",
    description: "A summary.",
    path: "/button-press",
    type: "article",
    article: { publishedTime: "2026-01-01", modifiedTime: "2026-02-01" },
  });
  expect(meta.title).toEqual({ absolute: "Button Press · Sanding Space" });
  expect(meta.alternates?.canonical).toBe(`${SITE_URL}/button-press`);
  expect(meta.openGraph).toMatchObject({
    title: "Button Press · Sanding Space",
    description: "A summary.",
    type: "article",
    publishedTime: "2026-01-01",
  });
  expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  expect(pageMetadata({ path: "/about" }).description).toBe(SITE_DESCRIPTION);
});
