jest.mock('../../../modules/auth/auth.service', () => ({
  login: jest.fn(),
  registerDueno: jest.fn(),
}));

const request = require('supertest');
const { app } = require('../../../app');

const authService = require('../../../modules/auth/auth.service');

describe('POST /auth/login', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna 200 y token cuando las credenciales son válidas', async () => {
    authService.login.mockResolvedValue({
      token: 'fake.jwt.token',
      rol: 'ADMIN',
      id_usuario: 2,
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@petsalud.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body).toBeTruthy();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.rol).toBe('ADMIN');
    expect(res.body.id_usuario).toBe(2);

    expect(authService.login).toHaveBeenCalledWith('admin@petsalud.com', 'Admin@123');
  });

  test('retorna 401 cuando el email no existe', async () => {
    authService.login.mockRejectedValue(new Error('Usuario no encontrado'));

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'noexiste@petsalud.com', password: 'Admin@123' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('retorna 401 cuando la clave es inválida', async () => {
    authService.login.mockRejectedValue(new Error('Contraseña incorrecta'));

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@petsalud.com', password: 'MalaClave' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
