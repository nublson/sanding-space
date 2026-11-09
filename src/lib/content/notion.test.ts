import type { PageObjectResponse } from "@notionhq/client";
import { describe, expect, it, vi } from "vitest";
import { getPromotions, queryAll } from "./notion";
import * as query from "./query";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));

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

describe("getPromotions", () => {
  it("returns no promotions without the data source env variable", async () => {
    vi.stubEnv("NOTION_PROMOTIONS_DATA_SOURCE_ID", "");
    vi.stubEnv("NOTION_TOKEN", "");
    await expect(getPromotions()).resolves.toEqual([]);
    vi.unstubAllEnvs();
  });
});

describe("getPromotions failures", () => {
  it("returns no promotions when the database can't be read", async () => {
    vi.stubEnv("NOTION_PROMOTIONS_DATA_SOURCE_ID", "not-shared");
    vi.stubEnv("NOTION_TOKEN", "secret");
    vi.spyOn(query, "queryAll").mockRejectedValue(
      new Error("object_not_found"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(getPromotions()).resolves.toEqual([]);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
});
