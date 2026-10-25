import type { PageObjectResponse } from "@notionhq/client";
import { describe, expect, it, vi } from "vitest";
import { queryAll } from "./notion";

const page = (i: number) => ({ object: "page", id: `p${i}` });

describe("queryAll", () => {
  it("follows pagination", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        results: Array.from({ length: 100 }, (_, i) => ({
          ...page(i),
          properties: {},
          url: "",
        })),
        has_more: true,
        next_cursor: "c1",
      })
      .mockResolvedValueOnce({
        results: [
          ...Array.from({ length: 3 }, (_, i) => ({
            ...page(100 + i),
            properties: {},
            url: "",
          })),
          { object: "page", id: "partial" },
        ],
        has_more: false,
        next_cursor: null,
      });
    const rows = await queryAll({ dataSources: { query } } as never, "ds");
    expect(rows).toHaveLength(103);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0]).toMatchObject({
      data_source_id: "ds",
      start_cursor: "c1",
    });
    expect(rows[0] as PageObjectResponse).toBeDefined();
  });
});
