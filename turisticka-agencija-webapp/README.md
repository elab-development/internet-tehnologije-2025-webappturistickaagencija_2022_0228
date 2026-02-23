# 🌍 Turistička Agencija – Web Aplikacija

Web aplikacija za upravljanje turističkim aranžmanima, rezervacijama i korisnicima, razvijena kao seminarski rad iz predmeta Internet Tehnologije.

---

## 📋 O aplikaciji

Aplikacija omogućava:

- Pregled turističkih aranžmana sa filterima po kategoriji, cijeni i destinaciji
- Detaljan prikaz aranžmana sa trenutnim vremenom i informacijama o državi (eksterni API-ji)
- Rezervaciju aranžmana za korisnike
- Admin panel za upravljanje aranžmanima, korisnicima, rezervacijama, kategorijama i popustima
- Agenti mogu pregledati i upravljati rezervacijama i aranžmanima putem zaštićenih API ruta
- Sistem popusta na aranžmane
- Autentifikaciju korisnika (registracija, prijava, odjava)
- Autorizacija bazirana na ulogama (admin, agent, korisnik)

---

## 🛠️ Tehnologije

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Baza podataka:** PostgreSQL
- **Eksterni API-ji:**
  - [OpenWeatherMap API](https://openweathermap.org/api) – trenutno vrijeme
  - [RestCountries API](https://restcountries.com/) – informacije o državama
- **Kontejnerizacija:** Docker, Docker Compose

---

## 🚀 Pokretanje aplikacije

### Preduslovi

- [Docker](https://www.docker.com/) i Docker Compose moraju biti instalirani

### Koraci

**1. Kloniraj repozitorij:**
```bash
git clone https://github.com/elab-development/internet-tehnologije-2025-webappturistickaagencija_2022_0228.git
cd internet-tehnologije-2025-webappturistickaagencija_2022_0228
```

**2. Kreiraj `.env` fajl u folderu `turisticka-agencija-webapp/`:**
```env
DATABASE_URL=postgresql://postgres:password@db:5432/turisticka_agencija
NEXTAUTH_SECRET=tvoj_secret
NEXT_PUBLIC_OPENWEATHER_API_KEY=tvoj_openweather_kljuc
```

**3. Pokreni aplikaciju:**
```bash
cd turisticka-agencija-webapp
docker-compose up --build
```

**4. Otvori u browseru:**
```
http://localhost:3000
```

---

## 👤 Podrazumijevani korisnici

| Uloga | Email | Lozinka |
|-------|-------|---------|
| Admin | emilija.kozomara@gmail.com | ema123 |
| Agent | jana.kiso@gmail.com | jana123 |
| Korisnik | pavle.kiso@gamil.com | pavle123 |

---

## 📁 Struktura projekta
```
turisticka-agencija-webapp/
├── app/
│   ├── components/     # Komponente (Button, WeatherWidget, CountryWidget...)
│   ├── api/            # API rute (arrangements, reservations, auth...)
│   ├── arrangements/   # Stranice aranžmana
│   ├── admin/          # Admin panel
├── prisma/
│   └── schema.prisma   # Šema baze podataka
├── docker-compose.yml
└── Dockerfile
```