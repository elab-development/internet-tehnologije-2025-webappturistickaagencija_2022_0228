"use client";

import { useState } from "react";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !message) {
      setError("Sva polja su obavezna.");
      return;
    }

    if (!email.includes("@")) {
      setError("Unesite ispravan email.");
      return;
    }

    if (message.length < 10) {
      setError("Poruka mora imati najmanje 10 karaktera.");
      return;
    }

    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Kontakt</h1>
      <p className="text-gray-500 mb-10">Imate pitanje? Javite nam se!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pošaljite poruku</h2>

          {sent && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
              Poruka je uspješno poslata! Odgovorićemo vam u najkraćem roku.
            </div>
          )}

          {error && (
            <div className="bg-[#CE4257]/10 border border-[#CE4257]/30 text-[#720026] px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <InputField
              label="Ime i prezime"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vaše ime"
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

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-gray-700">
                Poruka <span className="text-[#CE4257] ml-1">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Unesite vašu poruku..."
                required
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-[#FF7F51] transition-colors resize-none"
              />
            </div>

            <Button type="submit" fullWidth>
              Pošalji poruku
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Kontakt informacije</h2>
            <div className="flex flex-col gap-4 text-gray-600">
              <div className="flex items-center gap-3">
                <span className="text-xl">📍</span>
                <span>Bulevar oslobođenja 15, Beograd</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">📞</span>
                <span>+381 11 123 4567</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">✉️</span>
                <span>info@travelapp.rs</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🕐</span>
                <span>Pon - Pet: 09:00 - 17:00</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FF9B54]/10 rounded-xl border border-[#FF9B54]/30 p-8">
            <h2 className="text-xl font-semibold text-[#4F000B] mb-2">Brza pomoć</h2>
            <p className="text-[#720026] text-sm">
              Za hitna pitanja u vezi sa rezervacijama pozovite naš kontakt centar.
              Dostupni smo radnim danima od 09:00 do 17:00.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}