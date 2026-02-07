"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../../components/Button";

type UserItem = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "AGENT" | "CLIENT";
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") { router.push("/dashboard"); return; }

    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user, loading, router]);

  const refreshUsers = async () => {
    const res = await fetch("/api/admin/users").then((r) => r.json());
    setUsers(Array.isArray(res) ? res : []);
  };

  const handleRoleChange = async (id: number, role: string) => {
    setMessage("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Uloga promijenjena.");
      await refreshUsers();
    } else {
      setMessage(data.message || "Greška.");
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    setMessage("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage(isActive ? "Nalog deaktiviran." : "Nalog aktiviran.");
      await refreshUsers();
    } else {
      setMessage(data.message || "Greška.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovog korisnika?")) return;
    setMessage("");

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (res.ok) {
      setMessage("Korisnik obrisan.");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      setMessage(data.message || "Greška.");
    }
  };

  const roleColor = (role: string) => {
    if (role === "ADMIN") return "bg-[#720026]/10 text-[#720026]";
    if (role === "AGENT") return "bg-[#FF7F51]/20 text-[#4F000B]";
    return "bg-gray-100 text-gray-800";
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
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Korisnici</h1>
          <p className="text-gray-500 mt-1">Upravljajte nalozima korisnika</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          ← Nazad
        </Button>
      </div>

      {message && (
        <div className="bg-[#FF9B54]/10 border border-[#FF9B54]/30 text-[#4F000B] px-4 py-2 rounded-lg mb-6 text-sm">
          {message}
        </div>
      )}

      {users.length === 0 ? (
        <p className="text-gray-500">Nema korisnika.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {users.map((u) => (
            <div
              key={u.id}
              className={`bg-white rounded-xl border border-gray-200 p-6 ${!u.isActive ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {u.firstName} {u.lastName}
                    </h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColor(u.role)}`}>
                      {u.role}
                    </span>
                    {!u.isActive && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                        Deaktiviran
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{u.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Registrovan: {new Date(u.createdAt).toLocaleDateString("sr-RS")}
                  </p>
                </div>

                {u.id !== user.id && (
                  <div className="flex gap-2 ml-4 flex-wrap items-center">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:border-[#FF7F51]"
                    >
                      <option value="CLIENT">CLIENT</option>
                      <option value="AGENT">AGENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>

                    <Button
                      size="sm"
                      variant={u.isActive ? "outline" : "success"}
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                    >
                      {u.isActive ? "Deaktiviraj" : "Aktiviraj"}
                    </Button>

                    <Button size="sm" variant="danger" onClick={() => handleDelete(u.id)}>
                      Obriši
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}