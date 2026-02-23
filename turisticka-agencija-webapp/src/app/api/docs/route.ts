import { NextResponse } from "next/server";

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Turistička Agencija API",
    version: "1.0.0",
    description: "API dokumentacija za Turistička Agencija web aplikaciju",
  },
  tags: [
    { name: "Autentifikacija", description: "Registracija, prijava i odjava" },
    { name: "Aranžmani", description: "Upravljanje aranžmanima" },
    { name: "Kategorije", description: "Upravljanje kategorijama" },
    { name: "Rezervacije", description: "Upravljanje rezervacijama" },
    { name: "Popusti", description: "Upravljanje popustima" },
    { name: "Korisnici", description: "Upravljanje korisnicima (Admin)" },
    { name: "Upload", description: "Upload slika" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Registracija novog korisnika",
        tags: ["Autentifikacija"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "lastName", "email", "password"],
                properties: {
                  firstName: { type: "string", example: "Ana" },
                  lastName: { type: "string", example: "Anić" },
                  email: { type: "string", example: "ana@gmail.com" },
                  password: { type: "string", example: "lozinka123" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Korisnik uspješno registrovan" },
          "409": { description: "Korisnik sa ovim email-om već postoji" },
          "422": { description: "Sva polja su obavezna" },
          "500": { description: "Greška na serveru" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Prijava korisnika",
        tags: ["Autentifikacija"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "ana@gmail.com" },
                  password: { type: "string", example: "lozinka123" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Uspješna prijava, postavlja auth_token cookie" },
          "401": { description: "Pogrešan email ili lozinka" },
          "403": { description: "Nalog je deaktiviran" },
          "422": { description: "Email i lozinka su obavezni" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Odjava korisnika",
        tags: ["Autentifikacija"],
        responses: {
          "200": { description: "Uspješno odjavljen korisnik" },
        },
      },
    },
    "/api/arrangements": {
      get: {
        summary: "Dohvati sve aktivne aranžmane",
        tags: ["Aranžmani"],
        responses: {
          "200": { description: "Lista aktivnih aranžmana sa kategorijama" },
          "500": { description: "Greška na serveru" },
        },
      },
    },
    "/api/arrangements/{id}": {
      get: {
        summary: "Dohvati aranžman po ID-u",
        tags: ["Aranžmani"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Aranžman sa kategorijom i popustima" },
          "404": { description: "Aranžman ne postoji" },
          "422": { description: "Neispravan ID" },
        },
      },
    },
    "/api/admin/arrangements": {
      post: {
        summary: "Kreiraj novi aranžman (ADMIN/AGENT)",
        tags: ["Aranžmani"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["destination", "description", "price", "startDate", "endDate", "numberOfNights", "categoryId"],
                properties: {
                  destination: { type: "string", example: "Pariz" },
                  description: { type: "string", example: "Romantično putovanje" },
                  price: { type: "number", example: 999 },
                  startDate: { type: "string", format: "date", example: "2026-06-01" },
                  endDate: { type: "string", format: "date", example: "2026-06-08" },
                  numberOfNights: { type: "integer", example: 7 },
                  capacity: { type: "integer", example: 20 },
                  categoryId: { type: "integer", example: 1 },
                  image: { type: "string", example: "/images/pariz.jpg" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Aranžman uspješno kreiran" },
          "400": { description: "Neispravna cijena ili broj noći" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Nemate pravo pristupa" },
          "404": { description: "Kategorija ne postoji" },
          "422": { description: "Sva obavezna polja moraju biti popunjena" },
        },
      },
    },
    "/api/admin/arrangements/{id}": {
      put: {
        summary: "Ažuriraj aranžman (ADMIN/AGENT)",
        tags: ["Aranžmani"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  destination: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  startDate: { type: "string", format: "date" },
                  endDate: { type: "string", format: "date" },
                  numberOfNights: { type: "integer" },
                  capacity: { type: "integer" },
                  image: { type: "string" },
                  categoryId: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Aranžman ažuriran" },
          "400": { description: "Neispravna cijena ili kapacitet" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Možete mijenjati samo svoj aranžman" },
          "404": { description: "Aranžman ne postoji" },
        },
      },
      delete: {
        summary: "Obriši aranžman (ADMIN/AGENT)",
        tags: ["Aranžmani"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Aranžman obrisan" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Možete obrisati samo svoj aranžman" },
          "404": { description: "Aranžman ne postoji" },
          "409": { description: "Aranžman ima rezervacije i ne može se obrisati" },
        },
      },
    },
    "/api/categories": {
      get: {
        summary: "Dohvati sve kategorije",
        tags: ["Kategorije"],
        responses: {
          "200": { description: "Lista kategorija sa brojem aranžmana" },
          "500": { description: "Greška na serveru" },
        },
      },
    },
    "/api/admin/categories": {
      post: {
        summary: "Kreiraj novu kategoriju (ADMIN)",
        tags: ["Kategorije"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Ljetovanja" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Kategorija kreirana" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Nemate pravo pristupa" },
          "409": { description: "Kategorija sa ovim nazivom već postoji" },
          "422": { description: "Naziv kategorije je obavezan" },
        },
      },
    },
    "/api/admin/categories/{id}": {
      put: {
        summary: "Ažuriraj kategoriju (ADMIN)",
        tags: ["Kategorije"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Zimovanja" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Kategorija izmijenjena" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Nemate pravo pristupa" },
          "404": { description: "Kategorija ne postoji" },
          "409": { description: "Kategorija sa tim nazivom već postoji" },
        },
      },
      delete: {
        summary: "Obriši kategoriju (ADMIN)",
        tags: ["Kategorije"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Kategorija obrisana" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Nemate pravo pristupa" },
          "404": { description: "Kategorija ne postoji" },
          "409": { description: "Nije moguće obrisati kategoriju koja sadrži aranžmane" },
        },
      },
    },
    "/api/reservations": {
      get: {
        summary: "Dohvati rezervacije (ovisno o ulozi)",
        tags: ["Rezervacije"],
        description: "ADMIN vidi sve, AGENT vidi rezervacije svojih aranžmana, CLIENT vidi svoje rezervacije",
        responses: {
          "200": { description: "Lista rezervacija" },
          "401": { description: "Niste prijavljeni" },
          "500": { description: "Greška na serveru" },
        },
      },
      post: {
        summary: "Kreiraj rezervaciju (CLIENT)",
        tags: ["Rezervacije"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["arrangementId", "numberOfGuests"],
                properties: {
                  arrangementId: { type: "integer", example: 1 },
                  numberOfGuests: { type: "integer", example: 2 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Rezervacija uspješno kreirana" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Samo klijent može napraviti rezervaciju" },
          "404": { description: "Aranžman ne postoji" },
          "409": { description: "Nema dovoljno slobodnih mjesta" },
          "422": { description: "Nedostaju podaci" },
        },
      },
    },
    "/api/reservations/{id}": {
      get: {
        summary: "Dohvati rezervaciju po ID-u",
        tags: ["Rezervacije"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Rezervacija sa korisnikom i aranžmanom" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Nemate pristup ovoj rezervaciji" },
          "404": { description: "Rezervacija ne postoji" },
        },
      },
      delete: {
        summary: "Obriši rezervaciju",
        tags: ["Rezervacije"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Rezervacija obrisana" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Možete obrisati samo svoju rezervaciju" },
          "404": { description: "Rezervacija ne postoji" },
        },
      },
    },
    "/api/reservations/{id}/status": {
      put: {
        summary: "Ažuriraj status rezervacije",
        tags: ["Rezervacije"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
                    example: "CONFIRMED",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Status rezervacije ažuriran" },
          "400": { description: "Nema dovoljno slobodnih mjesta" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Nemate dozvolu za ovu akciju" },
          "404": { description: "Rezervacija ne postoji" },
        },
      },
    },
    "/api/discounts": {
      get: {
        summary: "Dohvati sve popuste",
        tags: ["Popusti"],
        responses: {
          "200": { description: "Lista popusta sa aranžmanima" },
          "500": { description: "Greška na serveru" },
        },
      },
      post: {
        summary: "Kreiraj popust (ADMIN/AGENT)",
        tags: ["Popusti"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["arrangementId", "type", "value", "startDate", "endDate"],
                properties: {
                  arrangementId: { type: "integer", example: 1 },
                  type: { type: "string", enum: ["PERCENTAGE", "FIXED"], example: "PERCENTAGE" },
                  value: { type: "number", example: 10 },
                  startDate: { type: "string", format: "date", example: "2026-06-01" },
                  endDate: { type: "string", format: "date", example: "2026-06-30" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Popust uspješno dodat" },
          "400": { description: "Neispravna vrijednost popusta" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Možete dodati popust samo na svoj aranžman" },
          "404": { description: "Aranžman ne postoji" },
        },
      },
    },
    "/api/discounts/{id}": {
      get: {
        summary: "Dohvati popust po ID-u",
        tags: ["Popusti"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Popust sa aranžmanom" },
          "404": { description: "Popust ne postoji" },
          "422": { description: "Neispravan ID" },
        },
      },
      put: {
        summary: "Ažuriraj popust (ADMIN/AGENT)",
        tags: ["Popusti"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["PERCENTAGE", "FIXED"] },
                  value: { type: "number", example: 15 },
                  startDate: { type: "string", format: "date" },
                  endDate: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Popust ažuriran" },
          "400": { description: "Neispravna vrijednost popusta" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Možete mijenjati samo popuste svojih aranžmana" },
          "404": { description: "Popust ne postoji" },
        },
      },
      delete: {
        summary: "Obriši popust (ADMIN)",
        tags: ["Popusti"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Popust obrisan" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Samo admin može brisati popust" },
          "404": { description: "Popust ne postoji" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        summary: "Dohvati sve korisnike (ADMIN)",
        tags: ["Korisnici"],
        responses: {
          "200": { description: "Lista korisnika" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Nemate pristup" },
        },
      },
    },
    "/api/admin/users/{id}": {
      put: {
        summary: "Ažuriraj korisnika (ADMIN)",
        tags: ["Korisnici"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["ADMIN", "AGENT", "CLIENT"] },
                  isActive: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Korisnik ažuriran" },
          "400": { description: "Ne možete mijenjati svoj nalog" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Nemate pristup" },
          "404": { description: "Korisnik nije pronađen" },
          "409": { description: "Korisnik ima rezervacije ili aranžmane" },
        },
      },
      delete: {
        summary: "Obriši korisnika (ADMIN)",
        tags: ["Korisnici"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Korisnik obrisan" },
          "400": { description: "Ne možete obrisati sebe" },
          "401": { description: "Niste prijavljeni" },
          "403": { description: "Nemate pristup" },
          "404": { description: "Korisnik ne postoji" },
          "409": { description: "Korisnik ima rezervacije ili aranžmane" },
        },
      },
    },
    "/api/upload": {
      post: {
        summary: "Upload slike aranžmana",
        tags: ["Upload"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Slika uploadovana, vraća URL" },
          "400": { description: "Fajl nije poslat" },
          "500": { description: "Greška pri uploadu" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(swaggerSpec);
}