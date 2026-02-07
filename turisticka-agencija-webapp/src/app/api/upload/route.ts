import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "Fajl nije poslat." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name.replace(/\s/g, "-")}`;
    const filepath = path.join(process.cwd(), "public/images/arrangements", filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/images/arrangements/${filename}` });
  } catch {
    return NextResponse.json({ message: "Greška pri uploadu." }, { status: 500 });
  }
}