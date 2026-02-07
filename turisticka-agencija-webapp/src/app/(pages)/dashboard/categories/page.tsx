"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../../components/Button";
import InputField from "../../../components/InputField";

type Category = {
  id: number;
  name: string;
  _count?: { arrangements: number };
};

export default function CategoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMsg, setEditMsg] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") { router.push("/dashboard"); return; }

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user, loading, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Kategorija kreirana!");
      setNewName("");
      const updated = await fetch("/api/categories").then((r) => r.json());
      setCategories(Array.isArray(updated) ? updated : []);
    } else {
      setMessage(data.message || "Greška.");
    }
  };

  const handleUpdate = async (id: number) => {
    setEditMsg("");

    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    const data = await res.json();

    if (res.ok) {
      setEditId(null);
      setEditName("");
      setEditMsg("Kategorija ažurirana!");
      const updated = await fetch("/api/categories").then((r) => r.json());
      setCategories(Array.isArray(updated) ? updated : []);
    } else {
      setEditMsg(data.message || "Greška.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovu kategoriju?")) return;

    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setMessage("Kategorija obrisana.");
    } else {
      setMessage(data.message || "Greška.");
    }
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditMsg("");
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Učitavanje...</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategorije</h1>
          <p className="text-gray-500 mt-1">Upravljajte kategorijama aranžmana</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          ← Nazad
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova kategorija</h2>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <InputField
              label="Naziv kategorije"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="npr. Letovanje"
              required
            />
          </div>
          <Button type="submit">Dodaj</Button>
        </form>
      </div>

      {editMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
          {editMsg}
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-gray-500">Nema kategorija.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-6">
              {editId === cat.id ? (
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <InputField
                      label="Novi naziv"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <Button variant="success" onClick={() => handleUpdate(cat.id)}>Sačuvaj</Button>
                  <Button variant="secondary" onClick={() => setEditId(null)}>Otkaži</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cat.name}</h3>
                    {cat._count && (
                      <p className="text-sm text-gray-500">
                        {cat._count.arrangements} aranžmana
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(cat)}>Izmijeni</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(cat.id)}>Obriši</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}