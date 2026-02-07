"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Sva polja su obavezna.");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.message || "Greška pri prijavi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Prijava
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Unesite vaše podatke za pristup nalogu
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vasemail@primer.com"
            required
          />

          <InputField
            label="Lozinka"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Unesite lozinku"
            required
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Prijavljivanje..." : "Prijavi se"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Nemate nalog?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Registrujte se
          </Link>
        </p>
      </div>
    </div>
  );
}