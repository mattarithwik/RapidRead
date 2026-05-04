import { NextResponse } from "next/server";
import { getArticle } from "@/lib/storage/localStore";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
  return NextResponse.json({ article });
}
