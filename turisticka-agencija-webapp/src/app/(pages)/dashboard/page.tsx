"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import InputField from "../../components/InputField";

type Arrangement = {
  id: number;
  destination: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  numberOfNights: number;
  capacity: number;
  category: { id: number; name: string };
  createdById: number;
};

type Reservation = {
  id: number;
  status: string;
  numberOfGuests: number;
  createdAt: string;
  arrangement: Arrangement;
  user?: { id: number; firstName: string; lastName: string; email: string };
};

type Category = {
  id: number;
  name: string;
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [selectedArrangement, setSelectedArrangement] = useState("");
  const [guests, setGuests] = useState("1");
  const [reservationMsg, setReservationMsg] = useState("");

  const [newDest, setNewDest] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newNights, setNewNights] = useState("");
  const [newCapacity, setNewCapacity] = useState("20");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [arrangementMsg, setArrangementMsg] = useState("");

  const [newCatName, setNewCatName] = useState("");
  const [categoryMsg, setCategoryMsg] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }

    const fetchData = async () => {
      try {
        const [resRes, arrRes, catRes] = await Promise.all([
          fetch("/api/reservations"),
          fetch("/api/arrangements"),
          fetch("/api/categories"),
        ]);
        const [res, arr, cat] = await Promise.all([
          resRes.json(),
          arrRes.json(),
          catRes.json(),
        ]);
        setReservations(Array.isArray(res) ? res : []);
        setArrangements(Array.isArray(arr) ? arr : []);
        setCategories(Array.isArray(cat) ? cat : []);
      } catch {
        console.error("Greška pri učitavanju podataka.");
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

  const handleArrangement = async (e: React.FormEvent) => {
    e.preventDefault();
    setArrangementMsg("");

    const res = await fetch("/api/admin/arrangements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: newDest,
        description: newDesc,
        price: Number(newPrice),
        startDate: newStart,
        endDate: newEnd,
        numberOfNights: Number(newNights),
        capacity: Number(newCapacity),
        categoryId: Number(newCategoryId),
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setArrangementMsg("Aranžman kreiran!");
      setNewDest(""); setNewDesc(""); setNewPrice(""); setNewStart("");
      setNewEnd(""); setNewNights(""); setNewCapacity("20"); setNewCategoryId("");
      const updated = await fetch("/api/arrangements").then((r) => r.json());
      setArrangements(Array.isArray(updated) ? updated : []);
    } else {
      setArrangementMsg(data.message || "Greška.");
    }
  };

  const handleCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryMsg("");

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName }),
    });
    const data = await res.json();

    if (res.ok) {
      setCategoryMsg("Kategorija kreirana!");
      setNewCatName("");
      const updated = await fetch("/api/categories").then((r) => r.json());
      setCategories(Array.isArray(updated) ? updated : []);
    } else {
      setCategoryMsg(data.message || "Greška.");
    }
  };

  // Promjena statusa rezervacije
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
    if (status === "CONFIRMED") return "green";
    if (status === "CANCELLED") return "red";
    if (status === "COMPLETED") return "gray";
    return "yellow";
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

      {user.role === "ADMIN" && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upravljanje kategorijama</h2>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Nova kategorija</h3>
            {categoryMsg && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm">
                {categoryMsg}
              </div>
            )}
            <form onSubmit={handleCategory} className="flex gap-4 items-end">
              <div className="flex-1">
                <InputField
                  label="Naziv kategorije"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="npr. Letovanje"
                  required
                />
              </div>
              <Button type="submit">Dodaj</Button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <Card key={c.id} title={c.name} badge={`ID: ${c.id}`} badgeColor="gray" />
            ))}
          </div>
        </section>
      )}

      {(user.role === "ADMIN" || user.role === "AGENT") && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Kreiraj aranžman</h2>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {arrangementMsg && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm">
                {arrangementMsg}
              </div>
            )}
            <form onSubmit={handleArrangement} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Destinacija" value={newDest} onChange={(e) => setNewDest(e.target.value)} placeholder="npr. Pariz" required />
              <InputField label="Opis" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Kratki opis" required />
              <InputField label="Cijena (€)" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0" required />
              <InputField label="Broj noći" type="number" value={newNights} onChange={(e) => setNewNights(e.target.value)} placeholder="0" required />
              <InputField label="Kapacitet" type="number" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} placeholder="20" required />
              <InputField label="Datum polaska" type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} required />
              <InputField label="Datum povratka" type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} required />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Kategorija <span className="text-red-500">*</span></label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-500"
                >
                  <option value="">Izaberi kategoriju</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <Button type="submit" fullWidth>Kreiraj aranžman</Button>
              </div>
            </form>
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
                <label className="text-sm font-medium text-gray-700">Aranžman <span className="text-red-500">*</span></label>
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

              <InputField
                label="Broj gostiju"
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                min="1"
                required
              />

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
                  {r.user && (
                    <span>🧑 {r.user.firstName} {r.user.lastName}</span>
                  )}

                  <div className="flex gap-2 mt-2 flex-wrap">
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