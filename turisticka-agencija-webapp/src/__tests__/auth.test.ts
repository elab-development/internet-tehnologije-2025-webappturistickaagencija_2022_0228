import { POST as login } from '@/app/api/auth/login/route';
import { POST as register } from '@/app/api/auth/register/route';
import { prisma } from '@/app/lib/prisma';
import { signToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSignToken = signToken as jest.Mock;

function makeRequest(body: object): Request {
  return {
    json: async () => body,
  } as Request;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 422 ako nedostaju podaci', async () => {
    const res = await login(makeRequest({ email: '' }));
    expect(res.status).toBe(422);
  });

  it('vraca 401 ako korisnik ne postoji', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await login(makeRequest({ email: 'a@b.com', password: '123456' }));
    expect(res.status).toBe(401);
  });

  it('vraca 403 ako je nalog deaktiviran', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1, email: 'a@b.com', password: await bcrypt.hash('123456', 10),
      isActive: false, role: 'CLIENT',
    });
    const res = await login(makeRequest({ email: 'a@b.com', password: '123456' }));
    expect(res.status).toBe(403);
  });

  it('vraca 401 ako je lozinka pogresna', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1, email: 'a@b.com', password: await bcrypt.hash('correctpass', 10),
      isActive: true, role: 'CLIENT',
    });
    const res = await login(makeRequest({ email: 'a@b.com', password: 'wrongpass' }));
    expect(res.status).toBe(401);
  });

  it('vraca 200 i token pri uspjesnom loginu', async () => {
    const hashed = await bcrypt.hash('123456', 10);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1, firstName: 'Ana', lastName: 'Jovic',
      email: 'ana@test.com', password: hashed,
      isActive: true, role: 'CLIENT',
    });
    mockSignToken.mockResolvedValue('mock-jwt-token');

    const res = await login(makeRequest({ email: 'ana@test.com', password: '123456' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe('ana@test.com');
  });
});

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('vraca 422 ako nedostaju polja', async () => {
    const res = await register(makeRequest({ firstName: 'Ana' }));
    expect(res.status).toBe(422);
  });

  it('vraca 422 ako je lozinka krace od 6 karaktera', async () => {
    const res = await register(makeRequest({
      firstName: 'Ana', lastName: 'Jovic',
      email: 'ana@test.com', password: '123',
    }));
    expect(res.status).toBe(422);
  });

  it('vraca 409 ako korisnik vec postoji', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: 'ana@test.com' });
    const res = await register(makeRequest({
      firstName: 'Ana', lastName: 'Jovic',
      email: 'ana@test.com', password: '123456',
    }));
    expect(res.status).toBe(409);
  });

  it('vraca 201 pri uspjesnoj registraciji', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.user.create as jest.Mock).mockResolvedValue({
      id: 1, firstName: 'Ana', lastName: 'Jovic',
      email: 'ana@test.com', role: 'CLIENT', isActive: true,
      createdAt: new Date(),
    });
    const res = await register(makeRequest({
      firstName: 'Ana', lastName: 'Jovic',
      email: 'ana@test.com', password: '123456',
    }));
    expect(res.status).toBe(201);
  });
});