"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(15,15,25,0.95)",
        border: "1px solid rgba(206,66,87,0.3)",
        borderRadius: "10px",
        padding: "10px 16px",
        color: "#fff",
        fontSize: "13px",
      }}>
        <p style={{ color: "#CE4257", fontWeight: 700, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || "#fff" }}>
            {p.name}: <b>{p.value}</b>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StatisticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role === "CLIENT") { router.push("/dashboard"); return; }

    fetch("/api/admin/statistics")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setDataLoading(false);
        setTimeout(() => setVisible(true), 100);
      })
      .catch(() => setDataLoading(false));
  }, [user, loading, router]);

  if (loading || dataLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f19 0%, #1a0a0e 50%, #0f0f19 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{
          width: 48, height: 48,
          border: "3px solid rgba(206,66,87,0.2)",
          borderTop: "3px solid #CE4257",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Učitavanje statistika...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!stats) return null;

  const totalRevenueFmt = stats.totals.totalRevenue.toLocaleString("sr-RS");

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f19 0%, #1a0a0e 50%, #0f0f19 100%)",
      padding: "40px 24px",
      fontFamily: "'Georgia', serif",
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(206,66,87,0.2) !important; }
        .chart-card { transition: transform 0.2s ease; }
        .chart-card:hover { transform: translateY(-2px); }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          marginBottom: 48,
          opacity: visible ? 1 : 0,
          animation: visible ? "fadeUp 0.6s ease forwards" : "none",
        }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "transparent",
              border: "1px solid rgba(206,66,87,0.4)",
              color: "#CE4257",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            ← Nazad
          </button>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "#CE4257", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
                Analitika
              </p>
              <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.1 }}>
                Statistike
              </h1>
            </div>
            <div style={{
              marginLeft: "auto",
              background: "rgba(206,66,87,0.1)",
              border: "1px solid rgba(206,66,87,0.2)",
              borderRadius: 12,
              padding: "8px 16px",
            }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>Ukupan prihod</p>
              <p style={{ color: "#CE4257", fontSize: 22, fontWeight: 700, margin: 0 }}>{totalRevenueFmt} €</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Rezervacije", value: stats.totals.totalReservations, icon: "🎫", delay: 0 },
            { label: "Aranžmani", value: stats.totals.totalArrangements, icon: "✈️", delay: 80 },
            { label: "Korisnici", value: stats.totals.totalUsers, icon: "👥", delay: 160 },
            { label: "Prihod", value: `${totalRevenueFmt} €`, icon: "💰", delay: 240 },
          ].map((kpi, i) => (
            <div key={i} className="stat-card" style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "24px",
              opacity: visible ? 1 : 0,
              animation: visible ? `fadeUp 0.6s ease ${kpi.delay}ms forwards` : "none",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{kpi.icon}</div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 4px", letterSpacing: 1, textTransform: "uppercase" }}>
                {kpi.label}
              </p>
              <p style={{ color: "#fff", fontSize: 28, fontWeight: 700, margin: 0 }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

          <div className="chart-card" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "28px",
            opacity: visible ? 1 : 0, animation: visible ? "fadeUp 0.7s ease 300ms forwards" : "none",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Distribucija</p>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: "0 0 24px" }}>Rezervacije po statusu</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stats.reservationsByStatus} dataKey="count" nameKey="status"
                  cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                  {stats.reservationsByStatus.map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.status] || "#999"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, STATUS_LABELS[name as string] || name]}
                  contentStyle={{ background: "rgba(15,15,25,0.95)", border: "1px solid rgba(206,66,87,0.3)", borderRadius: 10, color: "#fff" }}
                />
                <Legend formatter={(value) => <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{STATUS_LABELS[value] || value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "28px",
            opacity: visible ? 1 : 0, animation: visible ? "fadeUp 0.7s ease 380ms forwards" : "none",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Popularnost</p>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: "0 0 24px" }}>Top 5 destinacija</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.topDestinations} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="destination" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Rezervacije" radius={[6, 6, 0, 0]}>
                  {stats.topDestinations.map((_, index) => (
                    <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>

          <div className="chart-card" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "28px",
            opacity: visible ? 1 : 0, animation: visible ? "fadeUp 0.7s ease 460ms forwards" : "none",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Trend</p>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: "0 0 24px" }}>Rezervacije po mjesecima</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.reservationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" name="Rezervacije" stroke="#CE4257" strokeWidth={3}
                  dot={{ fill: "#CE4257", r: 5, strokeWidth: 0 }} activeDot={{ r: 7, fill: "#FF7F51" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "28px",
            opacity: visible ? 1 : 0, animation: visible ? "fadeUp 0.7s ease 540ms forwards" : "none",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Finansije</p>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: "0 0 24px" }}>Prihod po kategorijama</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.revenueByCategory} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                  axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: "rgba(15,15,25,0.95)", border: "1px solid rgba(206,66,87,0.3)", borderRadius: 10, color: "#fff" }}
                  formatter={(value: any) => [`${value.toLocaleString()} €`, "Prihod"]} />
                <Bar dataKey="revenue" name="Prihod" radius={[0, 6, 6, 0]}>
                  {stats.revenueByCategory.map((_, index) => (
                    <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}