import { A2A_SKILLS, type A2ADeps, handleA2ARequest } from "./a2a";
import type { EssayItem } from "./content";
import { AGENT_TOOLS } from "./tools";

const item: EssayItem = {
  slug: "button-press",
  title: "Button Press",
  summary: "",
  section: "Interaction",
  status: "Published",
  url: "https://sanding.space/button-press",
  demo: null,
  published: null,
};

const deps: A2ADeps = {
  listEssays: async () => [item],
  searchEssays: async (q) => (q === "button" ? [item] : []),
  getPage: async (path) =>
    path === "button-press" ? "# Button Press\n" : null,
  listDemos: async () => [],
  listResources: async () => [],
};

const send = (parts: unknown[], method = "SendMessage") =>
  handleA2ARequest(
    {
      jsonrpc: "2.0",
      id: 7,
      method,
      params: { message: { role: "ROLE_USER", messageId: "m", parts } },
    },
    deps,
  );

test("skills mirror the MCP tools", () => {
  expect(A2A_SKILLS.map((s) => s.id)).toEqual(AGENT_TOOLS.map((t) => t.name));
});

test("a data part runs the named skill", async () => {
  const res = await send([
    { data: { skill: "get_page", path: "/button-press/" } },
  ]);
  expect(res.id).toBe(7);
  expect(res.result?.message.role).toBe("ROLE_AGENT");
  expect(res.result?.message.parts).toEqual([{ text: "# Button Press\n" }]);
});

test("free text searches the essays", async () => {
  const res = await send([{ text: "button" }]);
  expect(res.result?.message.parts[0]).toEqual({
    text: '1 essay(s) matched "button".',
  });
});

test("a missing page answers with a hint, not an error", async () => {
  const res = await send([{ data: { skill: "get_page", path: "nope" } }]);
  expect(res.error).toBeUndefined();
  expect(res.result?.message.parts[0]).toEqual({
    text: 'No page at "nope". Use list_essays for essay slugs.',
  });
});

test.each([
  [{ jsonrpc: "1.0", id: 1, method: "SendMessage" }, -32600],
  [{ jsonrpc: "2.0", id: 1, method: "message/send" }, -32601],
  [{ jsonrpc: "2.0", id: 1, method: "GetTask" }, -32001],
  [{ jsonrpc: "2.0", id: 1, method: "SendMessage", params: {} }, -32602],
])("rejects %j with %i", async (body, code) => {
  expect((await handleA2ARequest(body, deps)).error?.code).toBe(code);
});

test("unknown skills and failing reads are errors", async () => {
  expect((await send([{ data: { skill: "nope" } }])).error?.code).toBe(-32602);
  const broken = { ...deps, listEssays: () => Promise.reject(new Error("x")) };
  const res = await handleA2ARequest(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "SendMessage",
      params: { message: { parts: [{ data: { skill: "list_essays" } }] } },
    },
    broken,
  );
  expect(res.error?.code).toBe(-32603);
});
