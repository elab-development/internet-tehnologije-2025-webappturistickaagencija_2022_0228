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

  } catch {
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

    const numValue = Number(value);

    if (numValue <= 0) {
      return NextResponse.json(
        { message: "Popust mora biti veći od 0." },
        { status: 400 }
      );
    }

    if (type === "PERCENTAGE" && numValue > 50) {
      return NextResponse.json(
        { message: "Procentualni popust ne može biti veći od 50%." },
        { status: 400 }
      );
    }

    if (type === "FIXED" && numValue > 100) {
      return NextResponse.json(
        { message: "Fiksni popust ne može biti veći od 100€." },
        { status: 400 }
      );
    }

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { message: "Datum početka mora biti prije kraja." },
        { status: 400 }
      );
    }

    const updated = await prisma.discount.update({
      where: { id },
      data: {
        type,
        value: numValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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

    const payload = await verifyToken(token);

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