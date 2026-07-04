import { NextResponse } from "next/server";
import { withGuards } from "@/lib/http/withGuards";
import { getArticle } from "@/lib/storage/store";

export const runtime = "nodejs";

export const GET = withGuards(
  async (_request, { params }) => {
    const { id } = (await params) ?? {};
    const article = await getArticle(id);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    return NextResponse.json({ article });
  },
  { requireAuth: false, skipCsrf: true }
);
