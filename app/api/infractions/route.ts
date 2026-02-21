import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_NAME = "infractions.json";

export async function GET() {
  const files = await list();
  const exists = files.blobs.find((b) => b.pathname === BLOB_NAME);

  if (!exists) {
    const defaultData = { infractions: [] };

    await put(BLOB_NAME, JSON.stringify(defaultData), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });

    return NextResponse.json(defaultData);
  }

  const data = await fetch(exists.url).then((r) => r.json());
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = body.password;

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

  // Load existing infractions
  const files = await list();
  const exists = files.blobs.find((b) => b.pathname === BLOB_NAME);

  let data = { infractions: [] as any[] };

  if (exists) {
    data = await fetch(exists.url).then((r) => r.json());
  }

  // Add new infraction
  const newInfraction = {
    department: body.department,
    points: body.points,
    description: body.description,
    date: Date.now(),
  };

  data.infractions.push(newInfraction);

  await put(BLOB_NAME, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const body = await req.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || body.password !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const index = body.index;
  if (index === undefined) {
    return NextResponse.json({ error: "Missing index" }, { status: 400 });
  }

  const files = await list();
  const exists = files.blobs.find((b) => b.pathname === BLOB_NAME);

  if (!exists) {
    return NextResponse.json({ error: "No infractions file" }, { status: 404 });
  }

  const data = await fetch(exists.url).then((r) => r.json());

  if (!Array.isArray(data.infractions)) {
    return NextResponse.json({ error: "Corrupted data" }, { status: 500 });
  }

  data.infractions.splice(index, 1);

  await put(BLOB_NAME, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });

  return NextResponse.json({ success: true });
}