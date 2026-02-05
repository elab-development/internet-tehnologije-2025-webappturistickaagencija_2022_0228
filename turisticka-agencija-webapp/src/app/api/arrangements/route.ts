import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const arrangements = await prisma.arrangement.findMany({
      where: { isActive: true },
      include: {
        category: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(arrangements);
  } catch (error) {
    return NextResponse.json(
      { message: "Greška na serveru." },
      { status: 500 }
    );
  }
}
