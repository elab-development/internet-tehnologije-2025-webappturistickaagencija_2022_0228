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

    if (payload.role !== "ADMIN" && payload.role !== "AGENT") {
      return NextResponse.json(
        { message: "Nemate pravo pristupa." },
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
      categoryId,
      capacity,
    } = body;

    if (
      !destination ||
      !price ||
      !startDate ||
      !endDate ||
      !numberOfNights ||
      !categoryId
    ) {
      return NextResponse.json(
        { message: "Sva obavezna polja moraju biti popunjena." },
        { status: 422 }
      );
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { message: "Datum početka mora biti prije datuma završetka." },
        { status: 422 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Kategorija ne postoji." },
        { status: 404 }
      );
    }

    const arrangement = await prisma.arrangement.create({
      data: {
        destination,
        description,
        price,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        numberOfNights,
        categoryId,
        capacity: capacity ?? 20,
        createdById: payload.userId
      },
    });

    return NextResponse.json(
      {
        message: "Aranžman je uspješno kreiran.",
        arrangement,
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
