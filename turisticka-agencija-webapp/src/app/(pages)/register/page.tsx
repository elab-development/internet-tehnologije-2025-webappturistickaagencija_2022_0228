"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Link from "next/link";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !password) {
      setError("Sva polja su obavezna.");
      return;
    }

    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 karaktera.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    setLoading(true);
    const result = await register({ firstName, lastName, email, password });
    setLoading(false);

    if (result.success) {
      router.push("/login");
    } else {
      setError(result.message || "Greška pri registraciji.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Registracija
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Kreirajte novi nalog
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <InputField
            label="Ime"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Unesite ime"
            required
          />

          <InputField
            label="Prezime"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Unesite prezime"
            required
          />

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
            placeholder="Najmanje 6 karaktera"
            required
          />

          <InputField
            label="Potvrdite lozinku"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ponovite lozinku"
            required
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Registracija..." : "Registruj se"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Već imate nalog?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Prijavite se
          </Link>
        </p>
      </div>
    </div>
  );
}