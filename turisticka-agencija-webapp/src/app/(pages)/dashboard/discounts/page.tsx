"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../../components/Button";
import InputField from "../../../components/InputField";

type Arrangement = { id: number; destination: string; createdById: number };

type Discount = {
  id: number;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  startDate: string;
  endDate: string;
  arrangementId: number;
  arrangement: Arrangement;
};

export default function DiscountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [arrId, setArrId] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editType, setEditType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [editValue, setEditValue] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user || user.role === "CLIENT") { router.push("/dashboard"); return; }

    const fetchData = async () => {
      try {
        const [discRes, arrRes] = await Promise.all([
          fetch("/api/discounts?dashboard=true"),
          fetch("/api/arrangements"),
        ]);
        const [disc, arr] = await Promise.all([discRes.json(), arrRes.json()]);
        const allArr = Array.isArray(arr) ? arr : [];
        const allDisc = Array.isArray(disc) ? disc : [];

        if (user.role === "AGENT") {
          const myArr = allArr.filter((a: Arrangement) => a.createdById === user.id);
          const myArrIds = new Set(myArr.map((a: Arrangement) => a.id));
          setArrangements(myArr);
          setDiscounts(allDisc.filter((d: Discount) => myArrIds.has(d.arrangementId)));
        } else {
          setArrangements(allArr);
          setDiscounts(allDisc);
        }
      } catch { console.error("Greška pri učitavanju."); }
      setDataLoading(false);
    };

    fetchData();
  }, [user, loading, router]);

  const refreshDiscounts = async () => {
    const res = await fetch("/api/discounts?dashboard=true").then(r => r.json());
    const allDisc = Array.isArray(res) ? res : [];
    if (user?.role === "AGENT") {
      const myArrIds = new Set(arrangements.map(a => a.id));
      setDiscounts(allDisc.filter((d: Discount) => myArrIds.has(d.arrangementId)));
    } else {
      setDiscounts(allDisc);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage("");
    const res = await fetch("/api/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arrangementId: Number(arrId), type, value: Number(value), startDate, endDate }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Popust kreiran!");
      setArrId(""); setValue(""); setStartDate(""); setEndDate(""); setShowForm(false);
      await refreshDiscounts();
    } else { setMessage(data.message || "Greška."); }
  };

  const startEdit = (d: Discount) => {
    setEditId(d.id); setEditType(d.type); setEditValue(String(d.value));
    setEditStart(d.startDate.split("T")[0]); setEditEnd(d.endDate.split("T")[0]);
  };

  const handleUpdate = async (id: number) => {
    setMessage("");
    const res = await fetch(`/api/discounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: editType, value: Number(editValue), startDate: editStart, endDate: editEnd }),
    });
    const data = await res.json();
    if (res.ok) { setEditId(null); setMessage("Popust ažuriran!"); await refreshDiscounts(); }
    else { setMessage(data.message || "Greška."); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni?")) return;
    const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) { setDiscounts(prev => prev.filter(d => d.id !== id)); setMessage("Popust obrisan."); }
    else { setMessage(data.message || "Greška."); }
  };

  const typeLabel = (t: string) => t === "PERCENTAGE" ? "Procenat (%)" : "Fiksni (€)";

  if (loading || dataLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Učitavanje...</p></div>;
  }
  if (!user || user.role === "CLIENT") return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === "AGENT" ? "Moji popusti" : "Popusti"}
          </h1>
          <p className="text-gray-500 mt-1">
            {user.role === "AGENT" ? "Popusti na vaše aranžmane" : "Upravljajte popustima na aranžmane"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Zatvori formu" : "+ Novi popust"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>← Nazad</Button>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-6 text-sm">{message}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Novi popust</h2>
          {arrangements.length === 0 ? (
            <p className="text-gray-500 text-sm">Nemate aranžmana za koje možete dodati popust.</p>
          ) : (
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Aranžman *</label>
                <select value={arrId} onChange={e => setArrId(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-500">
                  <option value="">Izaberi aranžman</option>
                  {arrangements.map(a => <option key={a.id} value={a.id}>{a.destination}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Tip popusta *</label>
                <select value={type} onChange={e => setType(e.target.value as "PERCENTAGE" | "FIXED")}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-500">
                  <option value="PERCENTAGE">Procenat (%)</option>
                  <option value="FIXED">Fiksni iznos (€)</option>
                </select>
              </div>
              <InputField label={type === "PERCENTAGE" ? "Vrijednost (%)" : "Vrijednost (€)"}
                type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0" required />
              <div className="hidden md:block" />
              <InputField label="Datum početka" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              <InputField label="Datum završetka" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              <div className="md:col-span-2">
                <Button type="submit" fullWidth>Kreiraj popust</Button>
              </div>
            </form>
          )}
        </div>
      )}

      {discounts.length === 0 ? (
        <p className="text-gray-500">{user.role === "AGENT" ? "Nemate popusta na vaše aranžmane." : "Nema popusta."}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {discounts.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-6">
              {editId === d.id ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Izmjena popusta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-sm font-medium text-gray-700">Tip popusta</label>
                      <select value={editType} onChange={e => setEditType(e.target.value as "PERCENTAGE" | "FIXED")}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-500">
                        <option value="PERCENTAGE">Procenat (%)</option>
                        <option value="FIXED">Fiksni iznos (€)</option>
                      </select>
                    </div>
                    <InputField label={editType === "PERCENTAGE" ? "Vrijednost (%)" : "Vrijednost (€)"}
                      type="number" value={editValue} onChange={e => setEditValue(e.target.value)} required />
                    <InputField label="Datum početka" type="date" value={editStart} onChange={e => setEditStart(e.target.value)} required />
                    <InputField label="Datum završetka" type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} required />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="success" onClick={() => handleUpdate(d.id)}>Sačuvaj</Button>
                    <Button variant="secondary" onClick={() => setEditId(null)}>Otkaži</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{d.arrangement.destination}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        d.type === "PERCENTAGE" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}>{typeLabel(d.type)}</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600 mb-2">
                      {d.type === "PERCENTAGE" ? `${d.value}%` : `${d.value}€`}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>📅 Od: {new Date(d.startDate).toLocaleDateString("sr-RS")}</span>
                      <span>📅 Do: {new Date(d.endDate).toLocaleDateString("sr-RS")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => startEdit(d)}>Izmijeni</Button>
                    {user?.role === "ADMIN" && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(d.id)}>Obriši</Button>
                    )}
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