import { GET as getArrangements } from '@/app/api/arrangements/route';
import { GET as getArrangement, PUT, DELETE } from '@/app/api/admin/arrangements/[id]/route';
import { POST as createArrangement } from '@/app/api/admin/arrangements/route';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockVerifyToken = verifyToken as jest.Mock;
const mockCookies = cookies as jest.Mock;

function makeRequest(body?: object, url = 'http://localhost:3000/api/arrangements'): Request {
  return {
    json: async () => body ?? {},
    url,
  } as Request;
}

function mockAuth(role: string, userId = 1) {
  mockCookies.mockResolvedValue({ get: () => ({ value: 'mock-token' }) });
  mockVerifyToken.mockResolvedValue({ userId, role });
}

function mockNoAuth() {
  mockCookies.mockResolvedValue({ get: () => undefined });
}

describe('GET /api/arrangements', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca listu aktivnih aranzamana', async () => {
    const mockData = [
      { id: 1, destination: 'Pariz', isActive: true, category: { name: 'City break' } },
      { id: 2, destination: 'Rim', isActive: true, category: { name: 'City break' } },
    ];
    (mockPrisma.arrangement.findMany as jest.Mock).mockResolvedValue(mockData);

    const res = await getArrangements();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
  });
});

describe('GET /api/arrangements/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 422 za neispravan ID', async () => {
    const req = makeRequest(undefined, 'http://localhost:3000/api/arrangements/abc');
    const res = await getArrangement(req, { params: Promise.resolve({ id: 'abc' }) } as any);
    expect(res.status).toBe(422);
  });

  it('vraca 404 ako aranzman ne postoji', async () => {
    (mockPrisma.arrangement.findUnique as jest.Mock).mockResolvedValue(null);
    const req = makeRequest(undefined, 'http://localhost:3000/api/arrangements/999');
    const res = await getArrangement(req, { params: Promise.resolve({ id: '999' }) } as any);
    expect(res.status).toBe(404);
  });

  it('vraca aranzman ako postoji', async () => {
    (mockPrisma.arrangement.findUnique as jest.Mock).mockResolvedValue({
      id: 1, destination: 'Pariz', category: {}, discounts: [],
    });
    const req = makeRequest(undefined, 'http://localhost:3000/api/arrangements/1');
    const res = await getArrangement(req, { params: Promise.resolve({ id: '1' }) } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.destination).toBe('Pariz');
  });
});

describe('POST /api/admin/arrangements', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 401 ako nije prijavljen', async () => {
    mockNoAuth();
    const res = await createArrangement(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it('vraca 403 ako je CLIENT', async () => {
    mockAuth('CLIENT');
    const res = await createArrangement(makeRequest({}));
    expect(res.status).toBe(403);
  });

  it('vraca 400 ako je cijena 0', async () => {
    mockAuth('ADMIN');
    const res = await createArrangement(makeRequest({
      destination: 'Pariz', price: 0, numberOfNights: 5,
      startDate: '2026-06-01', endDate: '2026-06-06', categoryId: 1,
    }));
    expect(res.status).toBe(400);
  });

  it('vraca 400 ako je cijena veca od 10000', async () => {
    mockAuth('ADMIN');
    const res = await createArrangement(makeRequest({
      destination: 'Pariz', price: 15000, numberOfNights: 5,
      startDate: '2026-06-01', endDate: '2026-06-06', categoryId: 1,
    }));
    expect(res.status).toBe(400);
  });

  it('vraca 422 ako startDate nije prije endDate', async () => {
    mockAuth('ADMIN');
    const res = await createArrangement(makeRequest({
      destination: 'Pariz', price: 500, numberOfNights: 5,
      startDate: '2026-06-10', endDate: '2026-06-05', categoryId: 1,
    }));
    expect(res.status).toBe(422);
  });

  it('vraca 404 ako kategorija ne postoji', async () => {
    mockAuth('ADMIN');
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await createArrangement(makeRequest({
      destination: 'Pariz', description: 'Opis', price: 500, numberOfNights: 5,
      startDate: '2026-06-01', endDate: '2026-06-06', categoryId: 99,
    }));
    expect(res.status).toBe(404);
  });

  it('kreira aranzman uspjesno', async () => {
    mockAuth('AGENT', 2);
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: 'City break' });
    (mockPrisma.arrangement.create as jest.Mock).mockResolvedValue({
      id: 10, destination: 'Pariz', price: 500, createdById: 2,
    });
    const res = await createArrangement(makeRequest({
      destination: 'Pariz', description: 'Opis', price: 500, numberOfNights: 5,
      startDate: '2026-06-01', endDate: '2026-06-06', categoryId: 1, capacity: 20,
    }));
    expect(res.status).toBe(201);
  });
});

describe('DELETE /api/arrangements/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 401 ako nije prijavljen', async () => {
    mockNoAuth();
    const req = makeRequest(undefined, 'http://localhost:3000/api/arrangements/1');
    const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) } as any);
    expect(res.status).toBe(401);
  });

  it('vraca 409 ako aranzman ima rezervacije', async () => {
    mockAuth('ADMIN');
    (mockPrisma.arrangement.findUnique as jest.Mock).mockResolvedValue({
      id: 1, createdById: 1, reservations: [{ id: 1 }],
    });
    const req = makeRequest(undefined, 'http://localhost:3000/api/arrangements/1');
    const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) } as any);
    expect(res.status).toBe(409);
  });

  it('brise aranzman uspjesno', async () => {
    mockAuth('ADMIN');
    (mockPrisma.arrangement.findUnique as jest.Mock).mockResolvedValue({
      id: 1, createdById: 1, reservations: [],
    });
    (mockPrisma.arrangement.delete as jest.Mock).mockResolvedValue({});
    const req = makeRequest(undefined, 'http://localhost:3000/api/arrangements/1');
    const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) } as any);
    expect(res.status).toBe(200);
  });
});