"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";
import Button from "../../components/Button";

type Reservation = {
  id: number;
  status: string;
  numberOfGuests: number;
  createdAt: string;
  arrangement: {
    id: number;
    destination: string;
    price: number;
  };
  user?: { id: number; firstName: string; lastName: string; email: string };
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [arrangements, setArrangements] = useState<{ id: number; destination: string; price: number }[]>([]);
  const [selectedArrangement, setSelectedArrangement] = useState("");
  const [guests, setGuests] = useState("1");
  const [reservationMsg, setReservationMsg] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }

    const fetchData = async () => {
      try {
        const [resRes, arrRes] = await Promise.all([
          fetch("/api/reservations"),
          fetch("/api/arrangements"),
        ]);
        const [res, arr] = await Promise.all([resRes.json(), arrRes.json()]);
        setReservations(Array.isArray(res) ? res : []);
        setArrangements(Array.isArray(arr) ? arr : []);
      } catch {
        console.error("Greška pri učitavanju.");
      }
      setDataLoading(false);
    };

    fetchData();
  }, [user, loading, router]);

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setReservationMsg("");

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        arrangementId: Number(selectedArrangement),
        numberOfGuests: Number(guests),
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setReservationMsg("Rezervacija kreirana!");
      setSelectedArrangement("");
      setGuests("1");
      const updated = await fetch("/api/reservations").then((r) => r.json());
      setReservations(Array.isArray(updated) ? updated : []);
    } else {
      setReservationMsg(data.message || "Greška.");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await fetch("/api/reservations").then((r) => r.json());
      setReservations(Array.isArray(updated) ? updated : []);
    }
  };

  const handleDeleteReservation = async (id: number) => {
    const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReservations((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const statusColor = (status: string) => {
    if (status === "CONFIRMED") return "green" as const;
    if (status === "CANCELLED") return "red" as const;
    if (status === "COMPLETED") return "gray" as const;
    return "yellow" as const;
  };

  const statusLabel = (status: string) => {
    if (status === "CONFIRMED") return "Potvrđena";
    if (status === "CANCELLED") return "Otkazana";
    if (status === "COMPLETED") return "Završena";
    return "Na čekanju";
  };

  if (loading || dataLoading) {
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
        Uloga: <span className="font-medium text-blue-600">{user.role}</span>
      </p>

      {(user.role === "ADMIN" || user.role === "AGENT") && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upravljanje</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user.role === "ADMIN" && (
              <Card title="📁 Kategorije" description="Dodaj, izmijeni ili obriši kategorije">
                <Button fullWidth onClick={() => router.push("/dashboard/categories")}>
                  Upravljaj
                </Button>
              </Card>
            )}
            <Card title="✈️ Aranžmani" description="Kreiraj, izmijeni ili obriši aranžmane">
              <Button fullWidth onClick={() => router.push("/dashboard/arrangements")}>
                Upravljaj
              </Button>
            </Card>
            <Card title="🏷️ Popusti" description="Dodaj ili izmijeni popuste na aranžmane">
              <Button fullWidth onClick={() => router.push("/dashboard/discounts")}>
                Upravljaj
              </Button>
            </Card>
          </div>
        </section>
      )}

      {user.role === "CLIENT" && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Nova rezervacija</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {reservationMsg && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm">
                {reservationMsg}
              </div>
            )}
            <form onSubmit={handleReservation} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Aranžman *</label>
                <select
                  value={selectedArrangement}
                  onChange={(e) => setSelectedArrangement(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-500"
                >
                  <option value="">Izaberi aranžman</option>
                  {arrangements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.destination} - {a.price}€
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Broj gostiju *</label>
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  min="1"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-500"
                />
              </div>
              <Button type="submit">Rezerviši</Button>
            </form>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {user.role === "CLIENT" ? "Moje rezervacije" : "Rezervacije"}
        </h2>

        {reservations.length === 0 ? (
          <p className="text-gray-500">Nema rezervacija.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservations.map((r) => (
              <Card
                key={r.id}
                title={r.arrangement.destination}
                badge={statusLabel(r.status)}
                badgeColor={statusColor(r.status)}
              >
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <span>👥 Gostiju: {r.numberOfGuests}</span>
                  <span>💰 Cijena: {r.arrangement.price}€</span>
                  <span>📅 {new Date(r.createdAt).toLocaleDateString("sr-RS")}</span>
                  {r.user && <span>🧑 {r.user.firstName} {r.user.lastName}</span>}

                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(user.role === "ADMIN" || user.role === "AGENT") && r.status === "PENDING" && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleStatusChange(r.id, "CONFIRMED")}>Potvrdi</Button>
                        <Button size="sm" variant="danger" onClick={() => handleStatusChange(r.id, "CANCELLED")}>Otkaži</Button>
                      </>
                    )}
                    {(user.role === "ADMIN" || user.role === "AGENT") && r.status === "CONFIRMED" && (
                      <Button size="sm" variant="secondary" onClick={() => handleStatusChange(r.id, "COMPLETED")}>Završi</Button>
                    )}
                    {user.role === "CLIENT" && r.status === "PENDING" && (
                      <Button size="sm" variant="danger" onClick={() => handleDeleteReservation(r.id)}>Obriši</Button>
                    )}
                    {user.role === "ADMIN" && (
                      <Button size="sm" variant="danger" onClick={() => handleDeleteReservation(r.id)}>Obriši</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}