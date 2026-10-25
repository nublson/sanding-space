import { SiteDemoFrame } from "@/components/stage/demo-frame";
import { siteComponents } from "./renderer";

describe("siteComponents", () => {
  it("frames demos and renders linked databases and unsupported blocks as nothing", () => {
    expect(siteComponents.demo).toBe(SiteDemoFrame);
    const none = [siteComponents.child_database, siteComponents.unsupported];
    for (const C of none) expect((C as () => null)()).toBeNull();
  });
});
