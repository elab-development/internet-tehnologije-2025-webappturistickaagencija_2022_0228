"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "../../components/Card";
import Button from "../../components/Button";
import InputField from "../../components/InputField";

type Category = {
  id: number;
  name: string;
};

type Discount = {
  id: number;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  startDate: string;
  endDate: string;
  arrangementId: number;
};

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
  category: Category;
};

export default function ArrangementsPage() {
  const router = useRouter();

  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleCategory = (val: string) => { setSelectedCategory(val); setCurrentPage(1); };
  const handleSort = (val: string) => { setSortBy(val); setCurrentPage(1); };

  useEffect(() => {
    Promise.all([
      fetch("/api/arrangements").then((res) => res.json()),
      fetch("/api/categories").then((res) => res.json()),
      fetch("/api/discounts").then((res) => res.json()),
    ])
      .then(([arr, cat, disc]) => {
        setArrangements(Array.isArray(arr) ? arr : []);
        setCategories(Array.isArray(cat) ? cat : []);
        setDiscounts(Array.isArray(disc) ? disc : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getActiveDiscount = (arrangementId: number): Discount | null => {
    const now = new Date();

    const active = discounts.filter(
      (d) =>
        d.arrangementId === arrangementId &&
        new Date(d.startDate) <= now &&
        new Date(d.endDate) >= now
    );

    if (active.length === 0) return null;

    return active.sort((a, b) => b.value - a.value)[0];
  };

  const getDiscountedPrice = (price: number, discount: Discount | null): number | null => {
    if (!discount) return null;

    let newPrice = price;

    if (discount.type === "PERCENTAGE") {
      newPrice = price - (price * discount.value / 100);
    }

    if (discount.type === "FIXED") {
      newPrice = price - discount.value;
    }

    if (newPrice < 0) newPrice = 0;

    return Number(newPrice.toFixed(2));
  };

  const filtered = arrangements
    .filter((a) =>
      a.destination.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
    )
    .filter((a) =>
      selectedCategory ? a.category.id === Number(selectedCategory) : true
    )
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "nights") return b.numberOfNights - a.numberOfNights;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Učitavanje aranžmana...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Aranžmani</h1>
      <p className="text-gray-500 mb-8">Pronađite idealno putovanje za vas</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Pretraga"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Pretražite po destinaciji..."
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-gray-700">Kategorija</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300"
            >
              <option value="">Sve kategorije</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-gray-700">Sortiraj po</label>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300"
            >
              <option value="newest">Najnovije</option>
              <option value="price-asc">Cijena: najniža</option>
              <option value="price-desc">Cijena: najviša</option>
              <option value="nights">Broj noći</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Pronađeno: {filtered.length} aranžmana
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((a) => {
          const discount = getActiveDiscount(a.id);
          const discountedPrice = getDiscountedPrice(a.price, discount);

          return (
            <Card
              key={a.id}
              title={a.destination}
              description={a.description}
              price={discountedPrice ?? a.price}
              badge={a.category.name}
              badgeColor="blue"
              image={a.image || undefined}
            >
              <div className="flex flex-col gap-2 text-sm text-gray-500">

                {discount && discountedPrice !== null && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    🏷️ {discount.type === "PERCENTAGE"
                      ? `${discount.value}% popust`
                      : `${discount.value}€ popust`}
                    <div className="text-xs line-through">
                      {a.price.toLocaleString("sr-RS")} €
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>🌙 {a.numberOfNights} noći</span>
                  <span>👥 {a.capacity} mjesta</span>
                </div>

                <div className="flex justify-between">
                  <span>📅 {new Date(a.startDate).toLocaleDateString("sr-RS")}</span>
                  <span>📅 {new Date(a.endDate).toLocaleDateString("sr-RS")}</span>
                </div>

                <Button
                  fullWidth
                  onClick={() => router.push(`/arrangements/${a.id}`)}
                >
                  Rezerviši
                </Button>

              </div>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ← Prethodna
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                currentPage === page
                  ? "bg-[#CE4257] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sledeća →
          </Button>
        </div>
      )}
    </div>
  );
}
