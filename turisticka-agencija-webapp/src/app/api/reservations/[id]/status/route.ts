import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Niste prijavljeni." },
        { status: 401 }
      );
    }

    const payload: any = await verifyToken(token);

    if (payload.role === "CLIENT") {
      return NextResponse.json(
        { message: "Klijent ne može mijenjati status." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const reservationId = Number(url.pathname.split("/")[3]);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { message: "Neispravan ID." },
        { status: 422 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { message: "Status je obavezan." },
        { status: 422 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        arrangement: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Rezervacija ne postoji." },
        { status: 404 }
      );
    }

    if (
      payload.role === "AGENT" &&
      reservation.arrangement.createdById !== payload.userId
    ) {
      return NextResponse.json(
        { message: "Možete mijenjati samo rezervacije svojih aranžmana." },
        { status: 403 }
      );
    }

    if (status === "CONFIRMED" && reservation.status !== "CONFIRMED") {

      if (reservation.arrangement.capacity < reservation.numberOfGuests) {
        return NextResponse.json(
          { message: "Nema dovoljno slobodnih mjesta." },
          { status: 400 }
        );
      }

      await prisma.arrangement.update({
        where: { id: reservation.arrangementId },
        data: {
          capacity: {
            decrement: reservation.numberOfGuests,
          },
        },
      });
    }

    if (status === "CANCELLED" && reservation.status === "CONFIRMED") {
      await prisma.arrangement.update({
        where: { id: reservation.arrangementId },
        data: {
          capacity: {
            increment: reservation.numberOfGuests,
          },
        },
      });
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
    });

    return NextResponse.json({
      message: "Status rezervacije ažuriran.",
      updated,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Greška na serveru." },
      { status: 500 }
    );
  }
}
