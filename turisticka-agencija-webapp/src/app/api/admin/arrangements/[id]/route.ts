/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: "Neispravan ID." },
        { status: 422 }
      );
    }

    const arrangement = await prisma.arrangement.findUnique({
      where: { id: numericId },
      include: {
        category: true,
        discounts: true
      }
    });

    if (!arrangement) {
      return NextResponse.json(
        { message: "Aranžman ne postoji." },
        { status: 404 }
      );
    }

    return NextResponse.json(arrangement);
  } catch (error) {
    return NextResponse.json(
      { message: "Greška na serveru." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token)
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });

    const payload: any = await verifyToken(token);

    if (payload.role !== "ADMIN" && payload.role !== "AGENT")
      return NextResponse.json({ message: "Nemate dozvolu." }, { status: 403 });

    const id = Number(paramId);

    if (isNaN(id))
      return NextResponse.json({ message: "Neispravan ID." }, { status: 422 });

    const arrangement = await prisma.arrangement.findUnique({
      where: { id }
    });

    if (!arrangement)
      return NextResponse.json({ message: "Aranžman ne postoji." }, { status: 404 });

    if (payload.role !== "ADMIN" && arrangement.createdById !== payload.userId) {
      return NextResponse.json(
        { message: "Možete mijenjati samo svoj aranžman." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const { 
      destination, 
      description, 
      price, 
      startDate, 
      endDate, 
      numberOfNights, 
      capacity, 
      image,
      categoryId
    } = body;

    if (price !== undefined) {
      const numPrice = Number(price);

      if (numPrice <= 0) {
        return NextResponse.json(
          { message: "Cijena mora biti veća od 0." },
          { status: 400 }
        );
      }

      if (numPrice > 10000) {
        return NextResponse.json(
          { message: "Cijena je nerealna." },
          { status: 400 }
        );
      }
    }

    if (numberOfNights !== undefined && Number(numberOfNights) <= 0) {
      return NextResponse.json(
        { message: "Broj noći mora biti veći od 0." },
        { status: 400 }
      );
    }

    if (capacity !== undefined && Number(capacity) <= 0) {
      return NextResponse.json(
        { message: "Kapacitet mora biti veći od 0." },
        { status: 400 }
      );
    }

    const updated = await prisma.arrangement.update({
      where: { id },
      data: {
        destination,
        description,
        price: price !== undefined ? Number(price) : undefined,
        numberOfNights: numberOfNights !== undefined ? Number(numberOfNights) : undefined,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ...(image !== undefined ? { image } : {}),
        ...(payload.role === "ADMIN" && categoryId && {
          categoryId
        }),
      }
    });

    return NextResponse.json({
      message: "Aranžman ažuriran.",
      updated
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token)
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });

    const payload: any = await verifyToken(token);

    if (payload.role !== "ADMIN" && payload.role !== "AGENT")
      return NextResponse.json({ message: "Nemate dozvolu." }, { status: 403 });

    const id = Number(paramId);

    if (isNaN(id))
      return NextResponse.json({ message: "Neispravan ID." }, { status: 422 });

    const arrangement = await prisma.arrangement.findUnique({
      where: { id },
      include: { reservations: true }
    });

    if (!arrangement)
      return NextResponse.json({ message: "Aranžman ne postoji." }, { status: 404 });

    if (payload.role !== "ADMIN" && arrangement.createdById !== payload.userId) {
      return NextResponse.json(
        { message: "Možete obrisati samo svoj aranžman." },
        { status: 403 }
      );
    }

    if (arrangement.reservations.length > 0) {
      return NextResponse.json(
        { message: "Aranžman ima rezervacije i ne može se obrisati." },
        { status: 409 }
      );
    }

    await prisma.arrangement.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Aranžman obrisan." });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}