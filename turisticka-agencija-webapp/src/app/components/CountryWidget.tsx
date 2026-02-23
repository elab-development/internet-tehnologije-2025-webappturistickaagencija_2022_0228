"use client";

import { useEffect, useState } from "react";

type CountryData = {
  name: string;
  capital: string;
  currency: string;
  language: string;
  flag: string;
  region: string;
};

export default function CountryWidget({ destination }: { destination: string }) {
  const [country, setCountry] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parts = destination.split("–").map(p => p.trim());

    const queries = [...new Set([
      parts[1],
      parts[0],
      parts.join(" "),
    ].filter(Boolean))];

    const findBestMatch = (data: any[], query: string) => {
      if (!data || data.length === 0) return null;
      const exact = data.find(c => {
        const translations = Object.values(c.translations || {}).map((t: any) => t.common?.toLowerCase());
        return (
          c.name.common.toLowerCase() === query.toLowerCase() ||
          c.name.official.toLowerCase() === query.toLowerCase() ||
          translations.includes(query.toLowerCase())
        );
      });
      return exact || null; 
    };

    const tryAll = async () => {
      for (const query of queries) {
        const data = await fetch(`https://restcountries.com/v3.1/translation/${encodeURIComponent(query)}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null);
        const match = findBestMatch(data, query);
        if (match) return [match];
      }
      for (const query of queries) {
        const data = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(query)}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null);
        if (data && data.length === 1) return data; 
        const match = findBestMatch(data, query);
        if (match) return [match];
      }
      return null;
    };

    tryAll().then(data => {
      if (!data) { setLoading(false); return; }
      const c = data[0];
      const currencyCode = Object.keys(c.currencies || {})[0];
      const currency = currencyCode
        ? `${c.currencies[currencyCode].name} (${currencyCode})`
        : "N/A";
      const language = Object.values(c.languages || {})[0] as string || "N/A";

      setCountry({
        name: c.name.common,
        capital: c.capital?.[0] || "N/A",
        currency,
        language,
        flag: c.flags?.png || "",
        region: c.region || "N/A",
      });
      setLoading(false);
    });
  }, [destination]);

  if (loading) return <div className="text-sm text-gray-400">Učitavanje info o državi...</div>;
  if (!country) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        {country.flag && (
          <img src={country.flag} alt={country.name} className="w-10 h-6 object-cover rounded" />
        )}
        <h3 className="font-semibold text-gray-900">{country.name}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>🏙️ <b>Glavni grad:</b> {country.capital}</div>
        <div>🌍 <b>Region:</b> {country.region}</div>
        <div>💰 <b>Valuta:</b> {country.currency}</div>
        <div>🗣️ <b>Jezik:</b> {country.language}</div>
      </div>
    </div>
  );
}