import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_NAME = "leaderboard.json";

export async function GET() {
  const files = await list();
  const exists = files.blobs.find((b) => b.pathname === BLOB_NAME);

  if (!exists) {
    const defaultData = {
      departments: [
        { name: "Manipulator", points: 500 },
        { name: "Mobility", points: 500 },
        { name: "Programming", points: 500 },
        { name: "CAD", points: 500 },
        { name: "Wiring", points: 500 },
        { name: "Special Projects", points: 500 },
      ],
    };

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

  delete body.password;

  await put(BLOB_NAME, JSON.stringify(body), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });

  return NextResponse.json({ success: true });
}