import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ revalidated: false }, { status: 401 });
  }
  revalidateTag("notion", "max");
  return Response.json({ revalidated: true });
}
