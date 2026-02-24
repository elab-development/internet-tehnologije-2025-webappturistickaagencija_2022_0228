"use client";

import { useEffect, useState } from "react";

type WeatherData = {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
};

const cityNameMap: Record<string, string> = {
  "mikonos": "Mykonos",
  "kapadokija": "Goreme",
  "bora bora": "Bora Bora",
  "francuska polinezija": "Papeete",
  "dubai i abu dhabi": "Dubai",
};

function normalizeCityName(name: string): string {
  const lower = name.toLowerCase().trim();
  return cityNameMap[lower] || name;
}

export default function WeatherWidget({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const parts = city.split("–").map(p => p.trim());

    const rawQueries = [
      parts[0].split(" i ")[0].trim(),
      parts[0],
      parts[1],
      parts.join(" "),
    ].filter(Boolean);

    const queries = [...new Set(
      rawQueries.map(q => normalizeCityName(q))
    )];

    const tryAll = async () => {
      for (const query of queries) {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.cod === 200 || data.cod === "200") return data;
      }
      return null;
    };

    tryAll()
      .then(data => {
        if (!data) { setError(true); setLoading(false); return; }
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
        });
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [city]);

  if (loading) return <div className="text-sm text-gray-400">Učitavanje vremena...</div>;
  if (error) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
      <img
        src={`https://openweathermap.org/img/wn/${weather!.icon}@2x.png`}
        alt={weather!.description}
        className="w-16 h-16"
      />
      <div>
        <p className="text-2xl font-bold text-blue-800">{weather!.temp}°C</p>
        <p className="text-sm text-blue-600 capitalize">{weather!.description}</p>
        <p className="text-xs text-gray-500">
          💧 {weather!.humidity}% vlažnost · 💨 {weather!.windSpeed} m/s
        </p>
      </div>
    </div>
  );
}