"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

type Stats = {
  reservationsByStatus: { status: string; count: number }[];
  reservationsByMonth: { month: string; count: number }[];
  topDestinations: { destination: string; count: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  totals: {
    totalReservations: number;
    totalArrangements: number;
    totalUsers: number;
    totalRevenue: number;
  };
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "#10b981",
  PENDING: "#f59e0b",
  CANCELLED: "#ef4444",
  COMPLETED: "#6366f1",
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Potvrđeno",
  PENDING: "Na čekanju",
  CANCELLED: "Otkazano",
  COMPLETED: "Završeno",
};

const BAR_COLORS = ["#CE4257", "#FF7F51", "#f59e0b", "#10b981", "#6366f1"];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "ADMIN") { setStatsLoading(false); return; }

    fetch("/api/admin/statistics")
      .then(res => res.json())
      .then(data => { setStats(data); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Učitavanje...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Dobrodošli, {user.firstName}!
      </h1>
      <p className="text-gray-500 mb-10">
        Uloga: <span className="font-medium text-[#CE4257]">{user.role}</span>
      </p>

      {user.role === "ADMIN" && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Upravljanje sistemom</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            <Card title="Korisnici" description="Upravljanje korisnicima" image="/images/users.jpg">
              <Button fullWidth onClick={() => router.push("/dashboard/users")}>Upravljaj</Button>
            </Card>
            <Card title="Kategorije" description="Upravljanje kategorijama" image="/images/category.jpg">
              <Button fullWidth onClick={() => router.push("/dashboard/categories")}>Upravljaj</Button>
            </Card>
            <Card title="Aranžmani" description="Upravljanje aranžmanima" image="/images/arrangements.jpg">
              <Button fullWidth onClick={() => router.push("/dashboard/arrangements")}>Upravljaj</Button>
            </Card>
            <Card title="Popusti" description="Popusti na aranžmane" image="/images/discounts.jpg">
              <Button fullWidth onClick={() => router.push("/dashboard/discounts")}>Upravljaj</Button>
            </Card>
            <Card title="Rezervacije" description="Pregled i upravljanje rezervacijama" image="/images/artboard.png">
              <Button fullWidth onClick={() => router.push("/dashboard/reservations")}>Upravljaj</Button>
            </Card>
          </div>
        </section>
      )}

      {user.role === "AGENT" && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Upravljanje</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card title="Moji aranžmani" description="Upravljanje vašim aranžmanima" image="/images/arrangements.jpg">
              <Button fullWidth onClick={() => router.push("/dashboard/arrangements")}>Upravljaj</Button>
            </Card>
            <Card title="Moji popusti" description="Popusti na vaše aranžmane" image="/images/discounts.jpg">
              <Button fullWidth onClick={() => router.push("/dashboard/discounts")}>Upravljaj</Button>
            </Card>
            <Card title="Rezervacije" description="Rezervacije vaših aranžmana" image="/images/artboard.png">
              <Button fullWidth onClick={() => router.push("/dashboard/reservations")}>Upravljaj</Button>
            </Card>
          </div>
        </section>
      )}

      {user.role === "CLIENT" && (
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card title="Moje rezervacije" description="Pregled vaših rezervacija" image="/images/artboard.png">
              <Button fullWidth onClick={() => router.push("/dashboard/reservations")}>Pogledaj</Button>
            </Card>
          </div>
        </section>
      )}

      {user.role === "ADMIN" && !statsLoading && stats && (
        <section>
          <h2 className="text-xl font-semibold mb-6">Statistike</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Rezervacije", value: stats.totals.totalReservations, icon: "🎫" },
              { label: "Aranžmani", value: stats.totals.totalArrangements, icon: "✈️" },
              { label: "Korisnici", value: stats.totals.totalUsers, icon: "👥" },
              { label: "Prihod", value: `${stats.totals.totalRevenue.toLocaleString()} €`, icon: "💰" },
            ].map((kpi, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="text-2xl mb-2">{kpi.icon}</div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Rezervacije po statusu</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.reservationsByStatus} dataKey="count" nameKey="status"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                    {stats.reservationsByStatus.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.status] || "#999"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, STATUS_LABELS[name as string] || name]} />
                  <Legend formatter={(value) => STATUS_LABELS[value] || value} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Top 5 destinacija</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.topDestinations} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="destination" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Rezervacije" radius={[6, 6, 0, 0]}>
                    {stats.topDestinations.map((_, index) => (
                      <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Rezervacije po mjesecima</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.reservationsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" name="Rezervacije" stroke="#CE4257" strokeWidth={3}
                    dot={{ fill: "#CE4257", r: 4 }} activeDot={{ r: 6, fill: "#FF7F51" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Prihod po kategorijama</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.revenueByCategory} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }}
                    axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(value: any) => [`${value.toLocaleString()} €`, "Prihod"]} />
                  <Bar dataKey="revenue" name="Prihod" radius={[0, 6, 6, 0]}>
                    {stats.revenueByCategory.map((_, index) => (
                      <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}