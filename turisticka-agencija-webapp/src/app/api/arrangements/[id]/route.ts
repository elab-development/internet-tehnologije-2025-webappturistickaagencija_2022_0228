import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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
        discounts: true,
      },
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
      { message: "Greška server." },
      { status: 500 }
    );
  }
}
