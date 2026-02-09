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

    const payload = await verifyToken(token);

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
      image,
    } = body;

    const numPrice = Number(price);
    const numNights = Number(numberOfNights);
    const numCapacity = Number(capacity ?? 20);

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

    if (numNights <= 0) {
      return NextResponse.json(
        { message: "Broj noći mora biti veći od 0." },
        { status: 400 }
      );
    }

    if (numCapacity <= 0) {
      return NextResponse.json(
        { message: "Kapacitet mora biti veći od 0." },
        { status: 400 }
      );
    }


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
        price: numPrice,
        numberOfNights: numNights,
        capacity: numCapacity,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        categoryId,
        createdById: payload.userId,
        ...(image ? { image } : {}),
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