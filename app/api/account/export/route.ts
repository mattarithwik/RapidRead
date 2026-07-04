import { NextResponse } from "next/server";
import { withGuards } from "@/lib/http/withGuards";
import { exportUserData } from "@/lib/storage/store";

export const runtime = "nodejs";

export const POST = withGuards(async (_request, { userId }) => {
  const data = await exportUserData(userId!);
  return NextResponse.json(data);
});
