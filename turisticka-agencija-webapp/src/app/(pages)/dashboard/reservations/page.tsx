"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../../components/Card";
import Button from "../../../components/Button";

type Reservation = {
  id: number;
  status: string;
  numberOfGuests: number;
  createdAt: string;
  arrangement: {
    id: number;
    destination: string;
    price: number;
    image?: string;
    discounts?: {
      id: number;
      type: "PERCENTAGE" | "FIXED";
      value: number;
      startDate: string;
      endDate: string;
    }[];
  };
  user?: { id: number; firstName: string; lastName: string; email: string };
};

export default function ReservationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }

    fetch("/api/reservations")
      .then(res => res.json())
      .then(data => {
        setReservations(Array.isArray(data) ? data : []);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user, loading, router]);

  const handleStatusChange = async (id: number, status: string) => {
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      const updated = await fetch("/api/reservations").then(r => r.json());
      setReservations(Array.isArray(updated) ? updated : []);
    } else {
      alert("Greška pri promjeni statusa");
    }
  };

  const handleDeleteReservation = async (id: number) => {
    if (!confirm("Da li ste sigurni?")) return;
    const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReservations(prev => prev.filter(r => r.id !== id));
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

  const calculateTotalPrice = (r: Reservation) => {
    let total = r.arrangement.price * r.numberOfGuests;
    const discount = r.arrangement.discounts?.[0];
    if (discount) {
      if (discount.type === "PERCENTAGE") total = total - total * (discount.value / 100);
      if (discount.type === "FIXED") total = total - discount.value;
    }
    if (total < 0) total = 0;
    return total.toFixed(2);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rezervacije</h1>
          <p className="text-gray-500 mt-1">
            {user.role === "CLIENT" ? "Moje rezervacije" : "Sve rezervacije"}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          ← Nazad
        </Button>
      </div>

      {reservations.length === 0 ? (
        <p className="text-gray-500">Nema rezervacija.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reservations.map(r => (
            <Card
              key={r.id}
              title={r.arrangement.destination}
              image={r.arrangement.image || "/images/santorini.jpg"}
              badge={statusLabel(r.status)}
              badgeColor={statusColor(r.status)}
            >
              <div className="flex flex-col gap-2 text-sm text-gray-600">
                <span>👥 Gostiju: {r.numberOfGuests}</span>
                <span>💰 Cijena: {calculateTotalPrice(r)}€</span>
                <span>📅 {new Date(r.createdAt).toLocaleDateString("sr-RS")}</span>

                {r.user && (
                  <span>🧑 {r.user.firstName} {r.user.lastName}</span>
                )}

                <div className="flex gap-2 mt-3 flex-wrap">
                  {(user.role === "ADMIN" || user.role === "AGENT") && r.status === "PENDING" && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleStatusChange(r.id, "CONFIRMED")}>
                        Potvrdi
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleStatusChange(r.id, "CANCELLED")}>
                        Otkaži
                      </Button>
                    </>
                  )}
                  {(user.role === "ADMIN" || user.role === "AGENT") && r.status === "CONFIRMED" && (
                    <Button size="sm" variant="secondary" onClick={() => handleStatusChange(r.id, "COMPLETED")}>
                      Završi
                    </Button>
                  )}
                  {user.role === "CLIENT" && r.status === "PENDING" && (
                    <Button size="sm" variant="danger" onClick={() => handleDeleteReservation(r.id)}>
                      Obriši
                    </Button>
                  )}
                  {user.role === "CLIENT" && r.status === "CONFIRMED" && (
                    <Button size="sm" variant="danger" onClick={() => handleStatusChange(r.id, "CANCELLED")}>
                      Otkaži rezervaciju
                    </Button>
                  )}
                  {user.role === "ADMIN" && (
                    <Button size="sm" variant="danger" onClick={() => handleDeleteReservation(r.id)}>
                      Obriši
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}