import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ message: "Nemate pristup." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const targetUser = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!targetUser) {
      return NextResponse.json({ message: "Korisnik nije pronađen." }, { status: 404 });
    }

    if (targetUser.id === payload.userId) {
      return NextResponse.json({ message: "Ne možete mijenjati sopstveni nalog." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.role) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ message: "Nemate pristup." }, { status: 403 });
    }

    const { id } = await params;

    if (Number(id) === payload.userId) {
      return NextResponse.json({ message: "Ne možete obrisati sopstveni nalog." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Korisnik obrisan." });
  } catch {
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}