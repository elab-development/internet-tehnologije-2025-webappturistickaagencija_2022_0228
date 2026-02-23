"use client";

import { useEffect, useState } from "react";

type WeatherData = {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
};

export default function WeatherWidget({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cityName = city.split("–")[0].trim();
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric&lang=hr`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.cod !== 200) { setError(true); setLoading(false); return; }
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