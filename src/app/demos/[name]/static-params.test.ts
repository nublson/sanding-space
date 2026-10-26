import { generateStaticParams } from "@/app/demos/[name]/page";
import { demoMeta } from "@/lib/demo-meta";

// Uses the real registry: with no demos yet, the route still needs one param.
test("static params fall back to a placeholder when no demos exist", () => {
  const params = generateStaticParams();
  const names = Object.keys(demoMeta);
  expect(params).toEqual(
    names.length ? names.map((name) => ({ name })) : [{ name: "__none" }],
  );
});
