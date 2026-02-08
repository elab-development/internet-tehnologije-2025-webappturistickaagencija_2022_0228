import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token)
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });

    const payload: any = await verifyToken(token);
    const url = new URL(req.url);
    const reservationId = Number(url.pathname.split("/").pop());

    if (isNaN(reservationId))
      return NextResponse.json({ message: "Neispravan ID." }, { status: 422 });

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: true,
        arrangement: true,
      },
    });

    if (!reservation)
      return NextResponse.json(
        { message: "Rezervacija ne postoji." },
        { status: 404 }
      );

    if (payload.role === "CLIENT" && reservation.userId !== payload.userId) {
      return NextResponse.json(
        { message: "Nemate pristup ovoj rezervaciji." },
        { status: 403 }
      );
    }

    if (
      payload.role === "AGENT" &&
      reservation.arrangement.createdById !== payload.userId
    ) {
      return NextResponse.json(
        { message: "Nemate pristup ovoj rezervaciji." },
        { status: 403 }
      );
    }

    return NextResponse.json(reservation);
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
    const url = new URL(req.url);
    const reservationId = Number(url.pathname.split("/").pop());

    if (isNaN(reservationId))
      return NextResponse.json({ message: "Neispravan ID." }, { status: 422 });

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { arrangement: true },
    });

    if (!reservation)
      return NextResponse.json(
        { message: "Rezervacija ne postoji." },
        { status: 404 }
      );

    if (payload.role === "CLIENT" && reservation.userId !== payload.userId) {
      return NextResponse.json(
        { message: "Možete obrisati samo svoju rezervaciju." },
        { status: 403 }
      );
    }

    if (
      payload.role === "AGENT" &&
      reservation.arrangement.createdById !== payload.userId
    ) {
      return NextResponse.json(
        { message: "Možete brisati samo rezervacije svojih aranžmana." },
        { status: 403 }
      );
    }

    if (reservation.status === "CONFIRMED") {
      await prisma.arrangement.update({
        where: { id: reservation.arrangementId },
        data: {
          capacity: {
            increment: reservation.numberOfGuests,
          },
        },
      });
    }

    await prisma.reservation.delete({
      where: { id: reservationId },
    });

    return NextResponse.json({ message: "Rezervacija obrisana." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}
