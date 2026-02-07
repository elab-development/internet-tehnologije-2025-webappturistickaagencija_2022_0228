"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "./components/Card";
import Button from "./components/Button";

type Arrangement = {
  id: number;
  destination: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  numberOfNights: number;
  category: { id: number; name: string };
};

export default function Home() {
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/arrangements")
      .then((res) => res.json())
      .then((data) => {
        setArrangements(Array.isArray(data) ? data.slice(0, 6) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero sekcija */}
      <section className="bg-gradient-to-r from-[#4F000B] to-[#CE4257] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Pronađite savršeno putovanje
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8">
            Istražite naše aranžmane i rezervišite odmor iz snova po najboljim cijenama.
          </p>
          <Button size="lg" onClick={() => router.push("/arrangements")}>
            Pogledaj aranžmane →
          </Button>
        </div>
      </section>

      {/* Prednosti */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Zašto izabrati nas?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="🌍 Raznovrsne destinacije">
            <p className="text-gray-600 text-sm">
              Od planinskih odmarališta do egzotičnih plaža — imamo ponudu za svakoga.
            </p>
          </Card>
          <Card title="💰 Najbolje cijene">
            <p className="text-gray-600 text-sm">
              Garantujemo konkurentne cijene i redovne popuste na odabrane aranžmane.
            </p>
          </Card>
          <Card title="⭐ Pouzdana usluga">
            <p className="text-gray-600 text-sm">
              Naš tim je tu da vam pomogne od rezervacije do povratka kući.
            </p>
          </Card>
        </div>
      </section>

      {/* Izdvojeni aranžmani */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Izdvojeni aranžmani
          </h2>

          {loading ? (
            <p className="text-center text-gray-500">Učitavanje...</p>
          ) : arrangements.length === 0 ? (
            <p className="text-center text-gray-500">Nema dostupnih aranžmana.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {arrangements.map((a) => (
                <Card
                  key={a.id}
                  title={a.destination}
                  description={a.description}
                  price={a.price}
                  badge={a.category.name}
                  badgeColor="blue"
                  onClick={() => router.push(`/arrangements`)}
                >
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{a.numberOfNights} noći</span>
                    <span>
                      {new Date(a.startDate).toLocaleDateString("sr-RS")}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button variant="outline" onClick={() => router.push("/arrangements")}>
              Vidi sve aranžmane
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4F000B] text-[#FF9B54]/70 py-8 px-4 text-center text-sm">
        <p>© 2025 TravelApp. Sva prava zadržana.</p>
      </footer>
    </div>
  );
}