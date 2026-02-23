"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/app/components/Button";
import WeatherWidget from "@/app/components/WeatherWidget";
import CountryWidget from "@/app/components/CountryWidget";

type Arrangement = {
  id: number;
  destination: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  numberOfNights: number;
  capacity: number;
  image: string | null;
  category: { id: number; name: string };
};

export default function ArrangementDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [loading, setLoading] = useState(true);

  const [guests, setGuests] = useState(1);
  const [reservationLoading, setReservationLoading] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`/api/arrangements/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setArrangement(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleReservation = async () => {
    if (!arrangement) return;

    setReservationLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrangementId: arrangement.id,
          numberOfGuests: guests,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Greška pri rezervaciji.");
        setReservationLoading(false);
        return;
      }

      setSuccessMsg("Rezervacija je uspješno poslata! Agent će je uskoro potvrditi.");
      setGuests(1);
    } catch {
      setErrorMsg("Serverska greška.");
    }

    setReservationLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Učitavanje...
      </div>
    );
  }

  if (!arrangement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Aranžman nije pronađen.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      <img
        src={
          arrangement.image
          ? `/api/images/${arrangement.image.replace("/images/", "")}`
          : "/api/images/globe.jpg"
        }
        className="w-full h-[420px] object-cover rounded-xl mb-6"
      />

      <h1 className="text-3xl font-bold mb-2">{arrangement.destination}</h1>
      <p className="text-gray-500 mb-6">{arrangement.category?.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">🌤️ Trenutno vrijeme</h2>
          <WeatherWidget city={arrangement.destination} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">🌍 Info o državi</h2>
          <CountryWidget destination={arrangement.destination} />
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-[#CE4257]/10 border border-[#CE4257]/30 text-[#720026] px-4 py-3 rounded-lg mb-6 text-sm">
          {errorMsg}
        </div>
      )}

      <p className="text-gray-700 mb-6">{arrangement.description}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div>
          <b>Cijena:</b> {arrangement.price} €
        </div>
        <div>
          <b>Noći:</b> {arrangement.numberOfNights}
        </div>
        <div>
          <b>Mjesta:</b> {arrangement.capacity}
        </div>
        <div>
          <b>Datum:</b>{" "}
          {new Date(arrangement.startDate).toLocaleDateString("sr-RS")}
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-2">Broj osoba:</p>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="border px-3 py-2 rounded"
        />
      </div>

      <div className="flex gap-4">
        <Button onClick={handleReservation} disabled={reservationLoading}>
          {reservationLoading ? "Rezervišem..." : "Rezerviši"}
        </Button>

        <Button variant="outline" onClick={() => router.push("/arrangements")}>
          Nazad
        </Button>
      </div>
    </div>
  );
}