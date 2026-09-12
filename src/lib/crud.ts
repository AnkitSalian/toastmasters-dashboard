import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readData, withFileLock } from "@/lib/db";

interface WithId {
  id: string;
}

export function makeCrudHandlers<T extends WithId>(file: string) {
  async function GET() {
    const items = await readData<T[]>(file, []);
    return NextResponse.json(items);
  }

  async function POST(req: NextRequest) {
    const body = (await req.json()) as Omit<T, "id">;
    const newItem = { ...body, id: randomUUID() } as T;
    await withFileLock<T[]>(file, [], (items) => [...items, newItem]);
    return NextResponse.json(newItem, { status: 201 });
  }

  async function PUT(req: NextRequest) {
    const body = (await req.json()) as T;
    let found = false;
    const items = await withFileLock<T[]>(file, [], (current) => {
      found = current.some((i) => i.id === body.id);
      return found ? current.map((i) => (i.id === body.id ? body : i)) : current;
    });
    if (!found) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(items.find((i) => i.id === body.id));
  }

  async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await withFileLock<T[]>(file, [], (items) => items.filter((i) => i.id !== id));
    return NextResponse.json({ ok: true });
  }

  return { GET, POST, PUT, DELETE };
}
