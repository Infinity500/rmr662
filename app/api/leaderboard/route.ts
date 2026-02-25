import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_NAME = "leaderboard.json";
const DEFAULT_POINTS = 500;

type Department = {
  name: string;
  points: number;
};

type LeaderboardData = {
  departments: Department[];
};

let writeChain: Promise<void> = Promise.resolve();

function withWriteLock<T>(task: () => Promise<T>): Promise<T> {
  const run = writeChain.then(task, task);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function isDepartment(value: unknown): value is Department {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.points === "number" &&
    Number.isFinite(candidate.points)
  );
}

function sanitizeDepartments(departments: unknown): Department[] {
  if (!Array.isArray(departments)) return [];
  return departments
    .filter(isDepartment)
    .map((dept) => ({ name: dept.name.trim(), points: dept.points }));
}

function parseLeaderboardPayload(
  body: unknown
):
  | { ok: true; value: LeaderboardData }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const candidate = body as Record<string, unknown>;
  const departments = sanitizeDepartments(candidate.departments);
  if (departments.length === 0) {
    return { ok: false, error: "Invalid departments payload" };
  }

  return {
    ok: true,
    value: {
      departments,
    },
  };
}

function defaultData(): LeaderboardData {
  return {
    departments: [
      { name: "Manipulator", points: DEFAULT_POINTS },
      { name: "Mobility", points: DEFAULT_POINTS },
      { name: "Programming", points: DEFAULT_POINTS },
      { name: "CAD", points: DEFAULT_POINTS },
      { name: "Wiring", points: DEFAULT_POINTS },
      { name: "Special Projects", points: DEFAULT_POINTS },
    ],
  };
}

export async function GET() {
  const files = await list();
  const exists = files.blobs.find((b) => b.pathname === BLOB_NAME);

  if (!exists) {
    const seed = defaultData();

    await put(BLOB_NAME, JSON.stringify(seed), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });

    return NextResponse.json(seed);
  }

  const data = await fetch(exists.url).then((r) => r.json());
  const parsed = parseLeaderboardPayload(data);

  if (!parsed.ok) {
    const seed = defaultData();
    await put(BLOB_NAME, JSON.stringify(seed), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
    return NextResponse.json(seed);
  }

  return NextResponse.json(parsed.value);
}

export async function POST(req: Request) {
  const body = await req.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).password
      : undefined;

  if (!adminPassword) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (providedPassword !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    body &&
    typeof body === "object" &&
    (body as Record<string, unknown>).test === true
  ) {
    return NextResponse.json({ ok: true });
  }

  const parsed = parseLeaderboardPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await withWriteLock(async () => {
    await put(BLOB_NAME, JSON.stringify(parsed.value), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
  });

  return NextResponse.json({ success: true });
}
