/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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

    const payload: any = await verifyToken(token);

    if (payload.role !== "CLIENT") {
      return NextResponse.json(
        { message: "Samo klijent može napraviti rezervaciju." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { arrangementId, numberOfGuests } = body;

    if (!arrangementId || !numberOfGuests) {
      return NextResponse.json(
        { message: "Nedostaju podaci." },
        { status: 422 }
      );
    }

    const arrangement = await prisma.arrangement.findUnique({
      where: { id: arrangementId },
      include: { reservations: true }
    });

    if (!arrangement) {
      return NextResponse.json(
        { message: "Aranžman ne postoji." },
        { status: 404 }
      );
    }

    const reserved = arrangement.reservations.reduce(
      (sum: number, r: any) => sum + r.numberOfGuests,
        0
      );

    if (reserved + numberOfGuests > arrangement.capacity) {
      return NextResponse.json(
        { message: "Nema dovoljno slobodnih mjesta." },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: payload.userId,
        arrangementId,
        numberOfGuests,
        status: "PENDING"
      }
    });

    return NextResponse.json(
      {
        message: "Rezervacija uspješno kreirana.",
        reservation
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Greška na serveru." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token)
      return NextResponse.json(
        { message: "Niste prijavljeni." },
        { status: 401 }
      );

    const payload: any = await verifyToken(token);
    const now = new Date();

    if (payload.role === "ADMIN") {
      const reservations = await prisma.reservation.findMany({
        include: {
          user: true,
          arrangement: {
            include: {
              discounts: {
                where: {
                  startDate: { lte: now },
                  endDate: { gte: now }
                },
                orderBy: { value: "desc" }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return NextResponse.json(reservations);
    }

    if (payload.role === "AGENT") {
      const reservations = await prisma.reservation.findMany({
        where: {
          arrangement: {
            createdById: payload.userId
          }
        },
        include: {
          user: true,
          arrangement: {
            include: {
              discounts: {
                where: {
                  startDate: { lte: now },
                  endDate: { gte: now }
                },
                orderBy: { value: "desc" }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return NextResponse.json(reservations);
    }

    if (payload.role === "CLIENT") {
      const reservations = await prisma.reservation.findMany({
        where: {
          userId: payload.userId
        },
        include: {
          arrangement: {
            include: {
              discounts: {
                where: {
                  startDate: { lte: now },
                  endDate: { gte: now }
                },
                orderBy: { value: "desc" }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return NextResponse.json(reservations);
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Greška na serveru." },
      { status: 500 }
    );
  }
}
