import { POST as createReservation, GET as getReservations } from '@/app/api/reservations/route';
import { DELETE as deleteReservation } from '@/app/api/reservations/[id]/route';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockVerifyToken = verifyToken as jest.Mock;
const mockCookies = cookies as jest.Mock;

function makeRequest(body?: object, url = 'http://localhost:3000/api/reservations'): Request {
  return { json: async () => body ?? {}, url } as Request;
}

function mockAuth(role: string, userId = 1) {
  mockCookies.mockResolvedValue({ get: () => ({ value: 'mock-token' }) });
  mockVerifyToken.mockResolvedValue({ userId, role });
}

function mockNoAuth() {
  mockCookies.mockResolvedValue({ get: () => undefined });
}

describe('POST /api/reservations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 401 ako nije prijavljen', async () => {
    mockNoAuth();
    const res = await createReservation(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it('vraca 403 ako nije CLIENT', async () => {
    mockAuth('AGENT');
    const res = await createReservation(makeRequest({ arrangementId: 1, numberOfGuests: 2 }));
    expect(res.status).toBe(403);
  });

  it('vraca 422 ako nedostaju podaci', async () => {
    mockAuth('CLIENT');
    const res = await createReservation(makeRequest({}));
    expect(res.status).toBe(422);
  });

  it('vraca 404 ako aranzman ne postoji', async () => {
    mockAuth('CLIENT');
    (mockPrisma.arrangement.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await createReservation(makeRequest({ arrangementId: 99, numberOfGuests: 2 }));
    expect(res.status).toBe(404);
  });

  it('vraca 409 ako nema dovoljno mjesta', async () => {
    mockAuth('CLIENT');
    (mockPrisma.arrangement.findUnique as jest.Mock).mockResolvedValue({
      id: 1, capacity: 5,
      reservations: [{ numberOfGuests: 4 }],
    });
    const res = await createReservation(makeRequest({ arrangementId: 1, numberOfGuests: 3 }));
    expect(res.status).toBe(409);
  });

  it('kreira rezervaciju uspjesno', async () => {
    mockAuth('CLIENT', 3);
    (mockPrisma.arrangement.findUnique as jest.Mock).mockResolvedValue({
      id: 1, capacity: 20,
      reservations: [{ numberOfGuests: 2 }],
    });
    (mockPrisma.reservation.create as jest.Mock).mockResolvedValue({
      id: 5, userId: 3, arrangementId: 1, numberOfGuests: 2, status: 'PENDING',
    });
    const res = await createReservation(makeRequest({ arrangementId: 1, numberOfGuests: 2 }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.reservation.status).toBe('PENDING');
  });
});

describe('GET /api/reservations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 401 ako nije prijavljen', async () => {
    mockNoAuth();
    const res = await getReservations();
    expect(res.status).toBe(401);
  });

  it('admin dobija sve rezervacije', async () => {
    mockAuth('ADMIN');
    (mockPrisma.reservation.findMany as jest.Mock).mockResolvedValue([
      { id: 1, user: {}, arrangement: { discounts: [] } },
      { id: 2, user: {}, arrangement: { discounts: [] } },
    ]);
    const res = await getReservations();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
  });

  it('client dobija samo svoje rezervacije', async () => {
    mockAuth('CLIENT', 3);
    (mockPrisma.reservation.findMany as jest.Mock).mockResolvedValue([
      { id: 1, userId: 3, arrangement: { discounts: [] } },
    ]);
    const res = await getReservations();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
  });
});

describe('DELETE /api/reservations/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 401 ako nije prijavljen', async () => {
    mockNoAuth();
    const req = makeRequest(undefined, 'http://localhost:3000/api/reservations/1');
    const res = await deleteReservation(req, { params: { id: '1' } } as any);
    expect(res.status).toBe(401);
  });

  it('vraca 404 ako rezervacija ne postoji', async () => {
    mockAuth('CLIENT', 1);
    (mockPrisma.reservation.findUnique as jest.Mock).mockResolvedValue(null);
    const req = makeRequest(undefined, 'http://localhost:3000/api/reservations/99');
    const res = await deleteReservation(req, { params: { id: '99' } } as any);
    expect(res.status).toBe(404);
  });

  it('vraca 403 ako client pokusa obrisati tudju rezervaciju', async () => {
    mockAuth('CLIENT', 1);
    (mockPrisma.reservation.findUnique as jest.Mock).mockResolvedValue({
      id: 1, userId: 2, status: 'PENDING',
      arrangement: { createdById: 5 },
    });
    const req = makeRequest(undefined, 'http://localhost:3000/api/reservations/1');
    const res = await deleteReservation(req, { params: { id: '1' } } as any);
    expect(res.status).toBe(403);
  });

  it('brise rezervaciju uspjesno', async () => {
    mockAuth('CLIENT', 1);
    (mockPrisma.reservation.findUnique as jest.Mock).mockResolvedValue({
      id: 1, userId: 1, status: 'PENDING', numberOfGuests: 2, arrangementId: 1,
      arrangement: { createdById: 5 },
    });
    (mockPrisma.reservation.delete as jest.Mock).mockResolvedValue({});
    const req = makeRequest(undefined, 'http://localhost:3000/api/reservations/1');
    const res = await deleteReservation(req, { params: { id: '1' } } as any);
    expect(res.status).toBe(200);
  });
});