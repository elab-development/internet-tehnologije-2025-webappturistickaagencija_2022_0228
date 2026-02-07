import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dashboard = searchParams.get("dashboard");

    if (dashboard === "true") {
      const cookieStore = await cookies();
      const token = cookieStore.get("auth_token")?.value;

      if (token) {
        try {
          const payload = await verifyToken(token);

          if (payload.role === "AGENT") {
            const discounts = await prisma.discount.findMany({
              where: { arrangement: { createdById: payload.userId } },
              include: { arrangement: true },
              orderBy: { id: "desc" },
            });
            return NextResponse.json(discounts);
          }
        } catch {
          // invalid token, return all
        }
      }
    }

    const discounts = await prisma.discount.findMany({
      include: { arrangement: true },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(discounts);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Greška servera" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token)
      return NextResponse.json({ message: "Niste prijavljeni" }, { status: 401 });

    const payload = await verifyToken(token);

    if (payload.role !== "ADMIN" && payload.role !== "AGENT")
      return NextResponse.json({ message: "Nemate dozvolu" }, { status: 403 });

    const body = await req.json();
    const { arrangementId, type, value, startDate, endDate } = body;

    if (!arrangementId || !type || !value || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Sva polja su obavezna" },
        { status: 400 }
      );
    }

    const arrangement = await prisma.arrangement.findUnique({
      where: { id: Number(arrangementId) },
    });

    if (!arrangement) {
      return NextResponse.json(
        { message: "Aranžman ne postoji" },
        { status: 404 }
      );
    }

    if (payload.role === "AGENT" && arrangement.createdById !== payload.userId) {
      return NextResponse.json(
        { message: "Možete dodati popust samo na svoj aranžman." },
        { status: 403 }
      );
    }

    const discount = await prisma.discount.create({
      data: {
        arrangementId: Number(arrangementId),
        type,
        value: Number(value),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json({
      message: "Popust uspješno dodat.",
      discount
    });

  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Greška servera" },
      { status: 500 }
    );
  }
}