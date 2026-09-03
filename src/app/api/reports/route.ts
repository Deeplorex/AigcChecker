import { NextResponse } from "next/server";
import { getSql, newReportId } from "@/lib/db";

const MAX_BYTES = 64 * 1024;
const LEVELS = new Set(["pass", "warn", "fail"]);

export async function POST(request: Request) {
  const sql = getSql();
  if (!sql) {
    return NextResponse.json(
      { error: "sharing not configured" },
      { status: 503 },
    );
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // 最小结构校验：报告必须带合法判定等级与文件名
  const p = payload as {
    verdict?: { level?: string };
    file?: { name?: string };
    time?: string;
  };
  if (!p || !LEVELS.has(p.verdict?.level ?? "") || !p.file?.name) {
    return NextResponse.json({ error: "invalid report" }, { status: 400 });
  }

  const id = newReportId();
  try {
    await sql`INSERT INTO reports (id, payload) VALUES (${id}, ${raw}::jsonb)`;
  } catch {
    // 主键冲突或数据库错误：重试一次新 ID，仍失败则 500
    try {
      await sql`INSERT INTO reports (id, payload) VALUES (${newReportId()}, ${raw}::jsonb)`;
    } catch (e) {
      console.error("report insert failed", e);
      return NextResponse.json({ error: "insert failed" }, { status: 500 });
    }
  }
  return NextResponse.json({ id }, { status: 201 });
}
