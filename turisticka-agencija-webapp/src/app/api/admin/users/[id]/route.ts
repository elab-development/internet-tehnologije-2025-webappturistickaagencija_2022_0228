import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token)
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });

    const payload: any = await verifyToken(token);

    if (payload.role !== "ADMIN")
      return NextResponse.json({ message: "Nemate pristup." }, { status: 403 });

    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").pop());

    const body = await req.json();

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        reservations: true,
        arrangements: true,
      },
    });

    if (!user)
      return NextResponse.json({ message: "Korisnik nije pronađen." }, { status: 404 });

    if (user.id === payload.userId)
      return NextResponse.json({ message: "Ne možete mijenjati svoj nalog." }, { status: 400 });

    if (body.isActive === false) {
      if (user.reservations.length > 0 || user.arrangements.length > 0) {
        return NextResponse.json(
          { message: "Korisnik ima rezervacije ili aranžmane i ne može se deaktivirati." },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (body.role) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await prisma.user.update({
      where: { id },
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
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token)
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });

    const payload: any = await verifyToken(token);

    if (payload.role !== "ADMIN")
      return NextResponse.json({ message: "Nemate pristup." }, { status: 403 });

    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").pop());

    if (id === payload.userId)
      return NextResponse.json({ message: "Ne možete obrisati sebe." }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        reservations: true,
        arrangements: true,
      },
    });

    if (!user)
      return NextResponse.json({ message: "Korisnik ne postoji." }, { status: 404 });

    if (user.reservations.length > 0 || user.arrangements.length > 0) {
      return NextResponse.json(
        { message: "Korisnik ima rezervacije ili aranžmane i ne može se obrisati." },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Korisnik obrisan." });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}