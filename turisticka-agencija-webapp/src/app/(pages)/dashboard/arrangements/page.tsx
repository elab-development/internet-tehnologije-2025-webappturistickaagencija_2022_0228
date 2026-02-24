"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../../components/Button";
import InputField from "../../../components/InputField";

type Category = { id: number; name: string };

type Arrangement = {
  id: number;
  destination: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  numberOfNights: number;
  capacity: number;
  createdById: number;
  image: string | null;
  category: Category;
};

export default function ManageArrangementsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [dest, setDest] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [nights, setNights] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editDest, setEditDest] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNights, setEditNights] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editCategoryId, setEditCategoryId] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user || user.role === "CLIENT") { router.push("/dashboard"); return; }

    const fetchData = async () => {
      try {
        const [arrRes, catRes] = await Promise.all([
          fetch("/api/arrangements"),
          fetch("/api/categories"),
        ]);
        const [arr, cat] = await Promise.all([arrRes.json(), catRes.json()]);
        const allArr = Array.isArray(arr) ? arr : [];

        const filtered = user.role === "AGENT"
          ? allArr.filter((a: Arrangement) => a.createdById === user.id)
          : allArr;

        setArrangements(filtered);
        setCategories(Array.isArray(cat) ? cat : []);
      } catch {
        console.error("Greška pri učitavanju.");
      }
      setDataLoading(false);
    };

    fetchData();
  }, [user, loading, router]);

  const refreshArrangements = async () => {
    const res = await fetch("/api/arrangements").then(r => r.json());
    const allArr = Array.isArray(res) ? res : [];
    const filtered = user?.role === "AGENT"
      ? allArr.filter((a: Arrangement) => a.createdById === user.id)
      : allArr;
    setArrangements(filtered);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) { const data = await res.json(); return data.url; }
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setUploading(true);
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) { setMessage("Greška pri uploadu slike."); setUploading(false); return; }
    }
    const res = await fetch("/api/admin/arrangements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: dest, description: desc, price: Number(price),
        startDate: start, endDate: end, numberOfNights: Number(nights),
        capacity: Number(capacity), categoryId: Number(categoryId), image: imageUrl,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Aranžman kreiran!");
      setDest(""); setDesc(""); setPrice(""); setStart("");
      setEnd(""); setNights(""); setCapacity("20"); setCategoryId("");
      setImageFile(null); setShowForm(false);
      await refreshArrangements();
    } else { setMessage(data.message || "Greška."); }
    setUploading(false);
  };

  const startEdit = (a: Arrangement) => {
    setEditId(a.id); setEditDest(a.destination); setEditDesc(a.description);
    setEditPrice(String(a.price)); setEditStart(a.startDate.split("T")[0]);
    setEditEnd(a.endDate.split("T")[0]); setEditNights(String(a.numberOfNights));
    setEditCapacity(String(a.capacity)); setEditImageFile(null);
    setEditCategoryId(String(a.category.id));
  };

  const handleUpdate = async (id: number) => {
    setMessage(""); setUploading(true);
    let imageUrl: string | undefined = undefined;
    if (editImageFile) {
      const uploaded = await uploadImage(editImageFile);
      if (!uploaded) { setMessage("Greška pri uploadu slike."); setUploading(false); return; }
      imageUrl = uploaded;
    }
    const res = await fetch(`/api/admin/arrangements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: editDest, description: editDesc, price: Number(editPrice),
        startDate: editStart, endDate: editEnd, numberOfNights: Number(editNights),
        capacity: Number(editCapacity),
        ...(user?.role === "ADMIN" && { categoryId: Number(editCategoryId) }),
        ...(imageUrl ? { image: imageUrl } : {}),
      }),
    });
    const data = await res.json();
    if (res.ok) { setEditId(null); setMessage("Aranžman ažuriran!"); await refreshArrangements(); }
    else { setMessage(data.message || "Greška."); }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovaj aranžman?")) return;
    const res = await fetch(`/api/admin/arrangements/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) { setArrangements(prev => prev.filter(a => a.id !== id)); setMessage("Aranžman obrisan."); }
    else { setMessage(data.message || "Greška."); }
  };

  if (loading || dataLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Učitavanje...</p></div>;
  }
  if (!user || user.role === "CLIENT") return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === "AGENT" ? "Moji aranžmani" : "Aranžmani"}
          </h1>
          <p className="text-gray-500 mt-1">
            {user.role === "AGENT" ? "Vaši kreirani aranžmani" : "Kreirajte i upravljajte aranžmanima"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Zatvori formu" : "+ Novi aranžman"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>← Nazad</Button>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-6 text-sm">{message}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Novi aranžman</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Destinacija" value={dest} onChange={e => setDest(e.target.value)} placeholder="npr. Pariz" required />
            <InputField label="Opis" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Kratki opis" required />
            <InputField label="Cijena (€)" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
            <InputField label="Broj noći" type="number" value={nights} onChange={e => setNights(e.target.value)} required />
            <InputField label="Kapacitet" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required />
            <InputField label="Datum polaska" type="date" value={start} onChange={e => setStart(e.target.value)} required />
            <InputField label="Datum povratka" type="date" value={end} onChange={e => setEnd(e.target.value)} required />
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-gray-700">Kategorija *</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-[#FF7F51]">
                <option value="">Izaberi kategoriju</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Slika aranžmana</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-[#FF7F51]" />
              {imageFile && <p className="text-xs text-gray-500">Izabrano: {imageFile.name}</p>}
            </div>
            <div className="md:col-span-2">
              <Button type="submit" fullWidth disabled={uploading}>
                {uploading ? "Učitavanje..." : "Kreiraj aranžman"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {arrangements.length === 0 ? (
        <p className="text-gray-500">{user.role === "AGENT" ? "Nemate kreiranih aranžmana." : "Nema aranžmana."}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {arrangements.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6">
              {editId === a.id ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Izmjena aranžmana</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Destinacija" value={editDest} onChange={e => setEditDest(e.target.value)} required />
                    <InputField label="Opis" value={editDesc} onChange={e => setEditDesc(e.target.value)} required />
                    <InputField label="Cijena (€)" type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} required />
                    <InputField label="Broj noći" type="number" value={editNights} onChange={e => setEditNights(e.target.value)} required />
                    <InputField label="Kapacitet" type="number" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} required />
                    <InputField label="Datum polaska" type="date" value={editStart} onChange={e => setEditStart(e.target.value)} required />
                    <InputField label="Datum povratka" type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} required />
                    {user?.role === "ADMIN" && (
                      <div className="flex flex-col gap-1.5 w-full md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Kategorija</label>
                        <select value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-[#FF7F51]">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5 w-full md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Nova slika (opciono)</label>
                      <input type="file" accept="image/*" onChange={e => setEditImageFile(e.target.files?.[0] || null)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-[#FF7F51]" />
                      {a.image && !editImageFile && <p className="text-xs text-gray-500">Trenutna slika: {a.image}</p>}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="success" onClick={() => handleUpdate(a.id)} disabled={uploading}>
                      {uploading ? "Učitavanje..." : "Sačuvaj"}
                    </Button>
                    <Button variant="secondary" onClick={() => setEditId(null)}>Otkaži</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {a.image && (
                      <img src={`/api/images/${a.image!.replace("/images/", "")}`} alt={a.destination}
                        className="w-32 h-24 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{a.destination}</h3>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                          {a.category.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{a.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>💰 {a.price}€</span>
                        <span>🌙 {a.numberOfNights} noći</span>
                        <span>👥 {a.capacity} mjesta</span>
                        <span>📅 {new Date(a.startDate).toLocaleDateString("sr-RS")} - {new Date(a.endDate).toLocaleDateString("sr-RS")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => startEdit(a)}>Izmijeni</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(a.id)}>Obriši</Button>
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