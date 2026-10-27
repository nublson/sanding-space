import { render } from "@testing-library/react";
import { resetWebmcpRegistration, WebmcpProvider } from "./webmcp-provider";

const NAMES = ["list_essays", "search_essays", "get_page"];

function withModelContext(target: object, value: unknown) {
  Object.defineProperty(target, "modelContext", {
    value,
    configurable: true,
  });
}

afterEach(() => {
  resetWebmcpRegistration();
  delete (navigator as { modelContext?: unknown }).modelContext;
  delete (document as { modelContext?: unknown }).modelContext;
});

test("provides the tools through provideContext, once per page load", () => {
  const provideContext = vi.fn();
  withModelContext(navigator, { provideContext, registerTool: vi.fn() });
  render(<WebmcpProvider />);
  render(<WebmcpProvider />);
  expect(provideContext).toHaveBeenCalledTimes(1);
  expect(
    provideContext.mock.calls[0][0].tools.map((t: { name: string }) => t.name),
  ).toEqual(NAMES);
});

test("falls back to registerTool on document.modelContext", () => {
  const registerTool = vi.fn();
  withModelContext(document, { registerTool });
  render(<WebmcpProvider />);
  expect(registerTool.mock.calls.map(([t]) => t.name)).toEqual(NAMES);
});

test("does nothing without the API, and survives one that throws", () => {
  expect(() => render(<WebmcpProvider />)).not.toThrow();
  resetWebmcpRegistration();
  withModelContext(navigator, {
    provideContext: () => {
      throw new Error("shape changed");
    },
  });
  expect(() => render(<WebmcpProvider />)).not.toThrow();
});
