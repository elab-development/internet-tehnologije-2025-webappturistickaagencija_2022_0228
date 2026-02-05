import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").pop());

    if (isNaN(id)) {
      return NextResponse.json({ message: "Neispravan ID." }, { status: 422 });
    }

    const discount = await prisma.discount.findUnique({
      where: { id },
      include: { arrangement: true },
    });

    if (!discount) {
      return NextResponse.json({ message: "Popust ne postoji." }, { status: 404 });
    }

    return NextResponse.json(discount);

  } catch (error) {
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token)
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });

    const payload: any = await verifyToken(token);

    if (payload.role !== "ADMIN" && payload.role !== "AGENT")
      return NextResponse.json({ message: "Nemate dozvolu." }, { status: 403 });

    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").pop());

    if (isNaN(id))
      return NextResponse.json({ message: "Neispravan ID." }, { status: 422 });

    const discount = await prisma.discount.findUnique({
      where: { id },
      include: { arrangement: true }
    });

    if (!discount)
      return NextResponse.json({ message: "Popust ne postoji." }, { status: 404 });

    if (payload.role === "AGENT" && discount.arrangement.createdById !== payload.userId) {
      return NextResponse.json(
        { message: "Možete mijenjati samo popuste svojih aranžmana." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type, value, startDate, endDate } = body;

    const updated = await prisma.discount.update({
      where: { id },
      data: {
        type,
        value: value ? Number(value) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return NextResponse.json({
      message: "Popust ažuriran.",
      updated
    });

  } catch (error) {
    console.error(error);
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
      return NextResponse.json({ message: "Samo admin može brisati popust." }, { status: 403 });

    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").pop());

    if (isNaN(id))
      return NextResponse.json({ message: "Neispravan ID." }, { status: 422 });

    const discount = await prisma.discount.findUnique({
      where: { id }
    });

    if (!discount)
      return NextResponse.json({ message: "Popust ne postoji." }, { status: 404 });

    await prisma.discount.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Popust obrisan." });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}
