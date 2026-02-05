import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function DELETE(
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

    const payload = await verifyToken(token);

    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Nemate pravo pristupa." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").pop());


    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Neispravan ID kategorije." },
        { status: 422 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        arrangements: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Kategorija ne postoji." },
        { status: 404 }
      );
    }

    if (category.arrangements.length > 0) {
      return NextResponse.json(
        {
          message:
            "Nije moguće obrisati kategoriju koja sadrži aranžmane.",
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Kategorija je uspešno obrisana." },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Greška na serveru." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
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

    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Nemate pravo pristupa." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").pop());

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Neispravan ID kategorije." },
        { status: 422 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { message: "Naziv kategorije je obavezan." },
        { status: 422 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Kategorija ne postoji." },
        { status: 404 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: "Kategorija sa tim nazivom već postoji." },
        { status: 409 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(
      {
        message: "Kategorija je uspešno izmijenjena.",
        category: updatedCategory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Greška na serveru." },
      { status: 500 }
    );
  }
}
