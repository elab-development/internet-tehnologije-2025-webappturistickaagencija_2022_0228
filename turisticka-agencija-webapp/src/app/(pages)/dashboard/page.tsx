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

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/reservations");
        const data = await res.json();
        setReservations(Array.isArray(data) ? data : []);
      } catch {
        console.error("Greška pri učitavanju rezervacija.");
      }
      setDataLoading(false);
    };

    fetchData();
  }, [user, loading, router]);

  const handleStatusChange = async (id: number, status: string) => {
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      const updated = await fetch("/api/reservations").then((r) => r.json());
      setReservations(Array.isArray(updated) ? updated : []);
    } else {
      alert("Greška pri promjeni statusa");
    }
  };

  const handleDeleteReservation = async (id: number) => {
    if (!confirm("Da li ste sigurni?")) return;

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

  const calculateTotalPrice = (r: Reservation) => {
    let total = r.arrangement.price * r.numberOfGuests;
    const discount = r.arrangement.discounts?.[0];

    if (discount) {
      if (discount.type === "PERCENTAGE") {
        total = total - total * (discount.value / 100);
      }
      if (discount.type === "FIXED") {
        total = total - discount.value;
      }
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Dobrodošli, {user.firstName}!
      </h1>

      <p className="text-gray-500 mb-10">
        Uloga: <span className="font-medium text-[#CE4257]">{user.role}</span>
      </p>

      {(user.role === "ADMIN" || user.role === "AGENT") && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Upravljanje sistemom</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {user.role === "ADMIN" && (
              <Card title="Korisnici" description="Upravljanje korisnicima" image="/images/users.jpg">
                <Button fullWidth onClick={() => router.push("/dashboard/users")}>
                  Upravljaj
                </Button>
              </Card>
            )}

            {user.role === "ADMIN" && (
              <Card title="Kategorije" description="Upravljanje kategorijama" image="/images/category.jpg">
                <Button fullWidth onClick={() => router.push("/dashboard/categories")}>
                  Upravljaj
                </Button>
              </Card>
            )}

            <Card title="Aranžmani" description="Upravljanje aranžmanima" image="/images/arrangements.jpg">
              <Button fullWidth onClick={() => router.push("/dashboard/arrangements")}>
                Upravljaj
              </Button>
            </Card>

            <Card title="Popusti" description="Popusti na aranžmane" image="/images/discounts.jpg">
              <Button fullWidth onClick={() => router.push("/dashboard/discounts")}>
                Upravljaj
              </Button>
            </Card>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-6">
          {user.role === "CLIENT" ? "Moje rezervacije" : "Sve rezervacije"}
        </h2>

        {reservations.length === 0 ? (
          <p className="text-gray-500">Nema rezervacija.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reservations.map((r) => (
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

                    {(user.role === "ADMIN" || user.role === "AGENT") &&
                      r.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="success" onClick={() => handleStatusChange(r.id, "CONFIRMED")}>
                            Potvrdi
                          </Button>

                          <Button size="sm" variant="danger" onClick={() => handleStatusChange(r.id, "CANCELLED")}>
                            Otkaži
                          </Button>
                        </>
                      )}

                    {(user.role === "ADMIN" || user.role === "AGENT") &&
                      r.status === "CONFIRMED" && (
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
      </section>
    </div>
  );
}
