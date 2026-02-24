import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token)
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });

    const payload = await verifyToken(token);
    if (payload.role !== "ADMIN" && payload.role !== "AGENT")
      return NextResponse.json({ message: "Nemate dozvolu." }, { status: 403 });

    const reservationsByStatus = await prisma.reservation.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const reservations = await prisma.reservation.findMany({
      select: { createdAt: true, status: true },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
    const monthlyMap: Record<string, number> = {};
    reservations.forEach(r => {
      const key = `${monthNames[r.createdAt.getMonth()]} ${r.createdAt.getFullYear()}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + 1;
    });
    const reservationsByMonth = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

    const topDestinations = await prisma.arrangement.findMany({
      select: {
        destination: true,
        _count: { select: { reservations: true } },
      },
      orderBy: { reservations: { _count: "desc" } },
      take: 5,
    });

    const confirmedReservations = await prisma.reservation.findMany({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      include: {
        arrangement: { include: { category: true } },
      },
    });

    const revenueMap: Record<string, number> = {};
    confirmedReservations.forEach(r => {
      const cat = r.arrangement.category.name;
      revenueMap[cat] = (revenueMap[cat] || 0) + r.arrangement.price * r.numberOfGuests;
    });
    const revenueByCategory = Object.entries(revenueMap).map(([category, revenue]) => ({ category, revenue }));

    const totalReservations = await prisma.reservation.count();
    const totalArrangements = await prisma.arrangement.count();
    const totalUsers = await prisma.user.count();
    const totalRevenue = confirmedReservations.reduce(
      (sum, r) => sum + r.arrangement.price * r.numberOfGuests, 0
    );

    return NextResponse.json({
      reservationsByStatus: reservationsByStatus.map(r => ({
        status: r.status,
        count: r._count.id,
      })),
      reservationsByMonth,
      topDestinations: topDestinations.map(d => ({
        destination: d.destination.split("–")[0].trim(),
        count: d._count.reservations,
      })),
      revenueByCategory,
      totals: {
        totalReservations,
        totalArrangements,
        totalUsers,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}