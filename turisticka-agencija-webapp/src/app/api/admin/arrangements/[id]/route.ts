/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").pop());

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Neispravan ID." },
        { status: 422 }
      );
    }

    const arrangement = await prisma.arrangement.findUnique({
      where: { id },
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
  { params }: { params: { id: string } }
) {
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
    const { destination, description, price, startDate, endDate, numberOfNights, capacity, image } = body;

    const updated = await prisma.arrangement.update({
      where: { id },
      data: {
        destination,
        description,
        price,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        numberOfNights,
        capacity,
        ...(image !== undefined ? { image } : {}),
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
  { params }: { params: { id: string } }
) {
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