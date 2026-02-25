import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_NAME = "infractions.json";
const MAX_DESCRIPTION_LENGTH = 500;

type Infraction = {
  department: string;
  points: number;
  description: string;
  date: number;
};

type InfractionsData = {
  infractions: Infraction[];
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

function isValidInfraction(value: unknown): value is Infraction {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.department === "string" &&
    candidate.department.trim().length > 0 &&
    typeof candidate.points === "number" &&
    Number.isFinite(candidate.points) &&
    typeof candidate.description === "string" &&
    candidate.description.trim().length > 0 &&
    candidate.description.length <= MAX_DESCRIPTION_LENGTH &&
    typeof candidate.date === "number" &&
    Number.isFinite(candidate.date)
  );
}

function coerceInfractionsData(value: unknown): InfractionsData {
  if (!value || typeof value !== "object") {
    return { infractions: [] };
  }

  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.infractions)) {
    return { infractions: [] };
  }

  return {
    infractions: candidate.infractions.filter(isValidInfraction),
  };
}

function parseInfractionPayload(body: unknown):
  | { ok: true; value: Omit<Infraction, "date"> }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const candidate = body as Record<string, unknown>;
  const department = candidate.department;
  const points = candidate.points;
  const description = candidate.description;

  if (typeof department !== "string" || department.trim().length === 0) {
    return { ok: false, error: "Invalid department" };
  }

  if (typeof points !== "number" || !Number.isFinite(points)) {
    return { ok: false, error: "Invalid points" };
  }

  if (
    typeof description !== "string" ||
    description.trim().length === 0 ||
    description.length > MAX_DESCRIPTION_LENGTH
  ) {
    return { ok: false, error: "Invalid description" };
  }

  return {
    ok: true,
    value: {
      department: department.trim(),
      points,
      description: description.trim(),
    },
  };
}

export async function GET() {
  const files = await list();
  const exists = files.blobs.find((b) => b.pathname === BLOB_NAME);

  if (!exists) {
    const defaultData: InfractionsData = { infractions: [] };

    await put(BLOB_NAME, JSON.stringify(defaultData), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });

    return NextResponse.json(defaultData);
  }

  const data = await fetch(exists.url).then((r) => r.json());
  const normalized = coerceInfractionsData(data);
  if (normalized.infractions.length !== (data?.infractions?.length ?? 0)) {
    await put(BLOB_NAME, JSON.stringify(normalized), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
  }
  return NextResponse.json(normalized);
}

export async function POST(req: Request) {
  const body = await req.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).password
      : undefined;

  if (!adminPassword) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  if (providedPassword !== adminPassword) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const parsed = parseInfractionPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await withWriteLock(async () => {
    // Load existing infractions
    const files = await list();
    const exists = files.blobs.find((b) => b.pathname === BLOB_NAME);

    let data: InfractionsData = { infractions: [] };

    if (exists) {
      const fetched = await fetch(exists.url).then((r) => r.json());
      data = coerceInfractionsData(fetched);
    }

    // Add new infraction
    const newInfraction: Infraction = {
      ...parsed.value,
      date: Date.now(),
    };

    data.infractions.push(newInfraction);

    await put(BLOB_NAME, JSON.stringify(data), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const body = await req.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const candidate =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (!adminPassword || candidate.password !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const index = candidate.index;
  if (typeof index !== "number" || !Number.isInteger(index)) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  try {
    await withWriteLock(async () => {
      const files = await list();
      const exists = files.blobs.find((b) => b.pathname === BLOB_NAME);

      if (!exists) {
        throw new Error("No infractions file");
      }

      const fetched = await fetch(exists.url).then((r) => r.json());
      const data = coerceInfractionsData(fetched);

      if (index < 0 || index >= data.infractions.length) {
        throw new RangeError("Index out of range");
      }

      data.infractions.splice(index, 1);

      await put(BLOB_NAME, JSON.stringify(data), {
        access: "public",
        contentType: "application/json",
        allowOverwrite: true,
      });
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return NextResponse.json({ error: "Index out of range" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "No infractions file") {
      return NextResponse.json({ error: "No infractions file" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete infraction" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
