"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          ✈ TravelApp
        </Link>

        {/* Desktop meni */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
            Početna
          </Link>
          <Link href="/arrangements" className="text-gray-600 hover:text-blue-600 transition-colors">
            Aranžmani
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
            Kontakt
          </Link>

          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <span className="text-sm text-gray-500">
                {user.firstName} ({user.role})
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 cursor-pointer"
              >
                Odjavi se
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                Prijava
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Registracija
              </Link>
            </>
          )}
        </div>

        {/* Hamburger dugme za mobilni */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-600 text-2xl cursor-pointer"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobilni meni */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 px-4 py-4 flex flex-col gap-3 bg-white">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-gray-600 hover:text-blue-600">
            Početna
          </Link>
          <Link href="/arrangements" onClick={() => setMenuOpen(false)} className="text-gray-600 hover:text-blue-600">
            Aranžmani
          </Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)} className="text-gray-600 hover:text-blue-600">
            Kontakt
          </Link>

          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-gray-600 hover:text-blue-600">
                Dashboard
              </Link>
              <span className="text-sm text-gray-500">
                {user.firstName} ({user.role})
              </span>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="text-sm text-red-600 hover:text-red-700 text-left cursor-pointer"
              >
                Odjavi se
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-gray-600 hover:text-blue-600">
                Prijava
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="text-blue-600 font-semibold">
                Registracija
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}