import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sql = getSql();
  if (!sql) {
    return NextResponse.json(
      { error: "sharing not configured" },
      { status: 503 },
    );
  }
  const { id } = await params;
  if (!/^[a-z0-9]{12}$/.test(id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const rows = await sql`SELECT payload FROM reports WHERE id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0].payload);
}
