import { put, list, get } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_NAME = "leaderboard.json";

export async function GET() {
  // Check if blob exists
  const files = await list();
  const exists = files.blobs.find((b) => b.pathname === BLOB_NAME);

  if (!exists) {
    // Default leaderboard
    const defaultData = {
      departments: [
        { name: "Mechanical", points: 500 },
        { name: "Electrical", points: 500 },
        { name: "Programming", points: 500 },
        { name: "CAD", points: 500 }
      ]
    };

    await put(BLOB_NAME, JSON.stringify(defaultData), {
      access: "public",
      contentType: "application/json"
    });

    return NextResponse.json(defaultData);
  }

  // Read existing blob
  const file = await get(BLOB_NAME);
  const data = await fetch(file.url).then((r) => r.json());

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  await put(BLOB_NAME, JSON.stringify(body), {
    access: "public",
    contentType: "application/json"
  });

  return NextResponse.json({ success: true });
}
