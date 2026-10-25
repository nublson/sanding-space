import { SITE_NAME, showPreviews, title } from "./site";

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
