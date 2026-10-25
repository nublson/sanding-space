import { SITE_NAME, title } from "./site";

test("title formats page names", () => {
  expect(SITE_NAME).toBe("Sanding Space");
  expect(title("Button Press")).toBe("Button Press · Sanding Space");
  expect(title()).toBe("Sanding Space");
});
