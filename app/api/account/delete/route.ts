import { NextResponse } from "next/server";
import { withGuards } from "@/lib/http/withGuards";
import { deleteUserData } from "@/lib/storage/store";

export const runtime = "nodejs";

export const POST = withGuards(async (_request, { userId }) => {
  await deleteUserData(userId!);
  return NextResponse.json({ ok: true });
});
