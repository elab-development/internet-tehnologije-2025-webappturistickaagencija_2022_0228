import { GET as getCategories } from '@/app/api/categories/route';
import { DELETE as deleteCategory, PUT as updateCategory } from '@/app/api/admin/categories/[id]/route';
import { POST as createCategory} from '@/app/api/admin/categories/route';
import { GET as getDiscounts, POST as createDiscount } from '@/app/api/discounts/route';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockVerifyToken = verifyToken as jest.Mock;
const mockCookies = cookies as jest.Mock;

function makeRequest(body?: object, url = 'http://localhost:3000/api'): Request {
  return { json: async () => body ?? {}, url } as Request;
}

function mockAuth(role: string, userId = 1) {
  mockCookies.mockResolvedValue({ get: () => ({ value: 'mock-token' }) });
  mockVerifyToken.mockResolvedValue({ userId, role });
}

function mockNoAuth() {
  mockCookies.mockResolvedValue({ get: () => undefined });
}

describe('GET /api/categories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca sve kategorije', async () => {
    (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Ljetovanje', _count: { arrangements: 3 } },
      { id: 2, name: 'Zimovanje', _count: { arrangements: 1 } },
    ]);
    const res = await getCategories();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
  });
});

describe('POST /api/admin/categories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 401 ako nije prijavljen', async () => {
    mockNoAuth();
    const res = await createCategory(makeRequest({ name: 'Nova' }));
    expect(res.status).toBe(401);
  });

  it('vraca 403 ako nije ADMIN', async () => {
    mockAuth('AGENT');
    const res = await createCategory(makeRequest({ name: 'Nova' }));
    expect(res.status).toBe(403);
  });

  it('vraca 422 ako naziv nedostaje', async () => {
    mockAuth('ADMIN');
    const res = await createCategory(makeRequest({}));
    expect(res.status).toBe(422);
  });

  it('vraca 409 ako kategorija vec postoji', async () => {
    mockAuth('ADMIN');
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: 'Ljetovanje' });
    const res = await createCategory(makeRequest({ name: 'Ljetovanje' }));
    expect(res.status).toBe(409);
  });

  it('kreira kategoriju uspjesno', async () => {
    mockAuth('ADMIN');
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.category.create as jest.Mock).mockResolvedValue({ id: 5, name: 'Nova kategorija' });
    const res = await createCategory(makeRequest({ name: 'Nova kategorija' }));
    expect(res.status).toBe(201);
  });
});

describe('DELETE /api/admin/categories/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 403 ako nije ADMIN', async () => {
    mockAuth('AGENT');
    const req = makeRequest(undefined, 'http://localhost:3000/api/admin/categories/1');
    const res = await deleteCategory(req, { params: { id: '1' } });
    expect(res.status).toBe(403);
  });

  it('vraca 409 ako kategorija ima aranzamane', async () => {
    mockAuth('ADMIN');
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({
      id: 1, name: 'Ljetovanje', arrangements: [{ id: 1 }],
    });
    const req = makeRequest(undefined, 'http://localhost:3000/api/admin/categories/1');
    const res = await deleteCategory(req, { params: { id: '1' } });
    expect(res.status).toBe(409);
  });

  it('brise kategoriju uspjesno', async () => {
    mockAuth('ADMIN');
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({
      id: 1, name: 'Prazna', arrangements: [],
    });
    (mockPrisma.category.delete as jest.Mock).mockResolvedValue({});
    const req = makeRequest(undefined, 'http://localhost:3000/api/admin/categories/1');
    const res = await deleteCategory(req, { params: { id: '1' } });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/discounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 401 ako nije prijavljen', async () => {
    mockNoAuth();
    const res = await createDiscount(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it('vraca 400 ako je popust 0', async () => {
    mockAuth('ADMIN');
    const res = await createDiscount(makeRequest({
      arrangementId: 1, type: 'PERCENTAGE', value: 0,
      startDate: '2026-03-01', endDate: '2026-04-01',
    }));
    expect(res.status).toBe(400);
  });

  it('vraca 400 ako je procentualni popust veci od 50', async () => {
    mockAuth('ADMIN');
    const res = await createDiscount(makeRequest({
      arrangementId: 1, type: 'PERCENTAGE', value: 60,
      startDate: '2026-03-01', endDate: '2026-04-01',
    }));
    expect(res.status).toBe(400);
  });

  it('vraca 400 ako je fiksni popust veci od 100', async () => {
    mockAuth('ADMIN');
    const res = await createDiscount(makeRequest({
      arrangementId: 1, type: 'FIXED', value: 150,
      startDate: '2026-03-01', endDate: '2026-04-01',
    }));
    expect(res.status).toBe(400);
  });

  it('kreira popust uspjesno', async () => {
    mockAuth('ADMIN');
    (mockPrisma.arrangement.findUnique as jest.Mock).mockResolvedValue({ id: 1, createdById: 1 });
    (mockPrisma.discount.deleteMany as jest.Mock).mockResolvedValue({});
    (mockPrisma.discount.create as jest.Mock).mockResolvedValue({
      id: 1, arrangementId: 1, type: 'PERCENTAGE', value: 15,
    });
    const res = await createDiscount(makeRequest({
      arrangementId: 1, type: 'PERCENTAGE', value: 15,
      startDate: '2026-03-01', endDate: '2026-04-01',
    }));
    expect(res.status).toBe(200);
  });
});