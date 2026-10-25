import {
  type Client,
  isFullPage,
  type PageObjectResponse,
} from "@notionhq/client";

export async function queryAll(
  client: Pick<Client, "dataSources">,
  dataSourceId: string,
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    for (const row of res.results) {
      if (isFullPage(row)) pages.push(row);
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages;
}
