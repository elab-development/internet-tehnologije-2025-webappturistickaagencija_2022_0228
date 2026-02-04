import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Niste prijavljeni." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Nemate pravo pristupa." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Naziv kategorije je obavezan." },
        { status: 422 }
      );
    }

    const category = await prisma.category.create({
      data: { name },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Greška na serveru." },
      { status: 500 }
    );
  }
}
