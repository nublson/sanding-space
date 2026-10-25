import { act, render, screen, waitFor } from "@testing-library/react";
import { EssayCard } from "@/components/library/essay-card";
import { SectionBlock } from "@/components/library/section-block";
import type { Essay } from "@/lib/content/types";

// Unlike essay-card.test.tsx, the real LiveThumbnail renders here.
let fire: () => void = () => {};
beforeEach(() => {
  window.IntersectionObserver = class {
    constructor(cb: (r: { isIntersecting: boolean }[]) => void) {
      fire = () => cb([{ isIntersecting: true }]);
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

const essay = (o: Partial<Essay>): Essay => ({
  id: "e",
  slug: "button-press",
  title: "Button press",
  summary: "Sum",
  status: "Published",
  order: 1,
  sectionId: "s",
  coverDemo: "button-press-scale",
  tags: [],
  published: null,
  updated: "2026-01-01",
  relatedIds: [],
  ...o,
});

async function expectNoFocusableButton(link: HTMLElement) {
  // The demo is mounted and live (it loads lazily)...
  await waitFor(() => expect(link.querySelector("button")).not.toBeNull());
  const button = link.querySelector("button");
  expect(button).not.toBeNull();
  // ...but sits in an inert, aria-hidden stage: out of the a11y tree and
  // out of the tab order.
  const stage = button?.closest("[inert]");
  expect(stage).not.toBeNull();
  expect(stage).toHaveAttribute("aria-hidden", "true");
  // (jsdom doesn't enforce inert focus blocking; browsers do.)
  expect(screen.queryByRole("button")).toBeNull();
}

describe("thumbnail previews inside links", () => {
  it("an EssayCard link contains no focusable button", async () => {
    render(<EssayCard essay={essay({})} />);
    act(() => fire());
    await expectNoFocusableButton(screen.getByRole("link"));
  });

  it("the featured SectionBlock link contains no focusable button", async () => {
    render(
      <SectionBlock
        section={{
          id: "s",
          slug: "interaction",
          name: "Interaction",
          question: "Q",
          order: 1,
          visible: true,
          essays: [essay({})],
        }}
        intro={null}
      />,
    );
    act(() => fire());
    await expectNoFocusableButton(screen.getByRole("link"));
  });
});
