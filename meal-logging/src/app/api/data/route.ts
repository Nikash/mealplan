import { NextResponse } from "next/server";
import type { AppData } from "@/lib/types";
import { readAppData, writeAppData } from "@/lib/server-data";

export async function GET() {
  const data = await readAppData();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const data = (await request.json()) as AppData;
  await writeAppData(data);
  return NextResponse.json({ ok: true });
}
