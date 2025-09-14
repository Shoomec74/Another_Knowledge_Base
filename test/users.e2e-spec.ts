import * as request from 'supertest';
import { E2EContext } from './helpers/e2e-setup';

describe('Users (e2e)', () => {
  const ctx = new E2EContext();
  let adminId: string;
  let adminToken: string;

  beforeAll(async () => {
    await ctx.start();
    const admin = await ctx.createAdmin('admin@test.com');
    adminId = admin.id;
    adminToken = admin.accessToken;
  });

  afterAll(async () => {
    await ctx.stop();
  });

  function auth(token: string) {
    return ctx.authHeader(token);
  }

  async function signup(email: string, password: string) {
    return ctx.signup(email, password);
  }

  it('Гость: GET /users -> 401', async () => {
    await request(ctx.app.getHttpServer()).get('/users').expect(401);
  });

  it('Гость: GET /users/me -> 401', async () => {
    await request(ctx.app.getHttpServer()).get('/users/me').expect(401);
  });

  it('Гость: POST /users -> 401', async () => {
    await request(ctx.app.getHttpServer())
      .post('/users')
      .send({ email: 'x@test.com', password: 'secret12', username: 'x' })
      .expect(401);
  });

  it('Гость: PATCH /users/:id -> 401', async () => {
    const u = await signup('guest.patch@test.com', 'secret12');
    await request(ctx.app.getHttpServer())
      .patch(`/users/${u._id}`)
      .send({ username: 'new' })
      .expect(401);
  });

  it('Гость: DELETE /users/:id -> 401', async () => {
    const u = await signup('guest.delete@test.com', 'secret12');
    await request(ctx.app.getHttpServer())
      .delete(`/users/${u._id}`)
      .expect(401);
  });

  it('Пользователь: GET /users -> 403', async () => {
    const user = await signup('user.list@test.com', 'secret12');
    await request(ctx.app.getHttpServer())
      .get('/users')
      .set(auth(user.credentials?.accessToken))
      .expect(403);
  });

  it('Пользователь: GET /users/me -> 200', async () => {
    const user = await signup('user.get@test.com', 'secret12');
    const res = await request(ctx.app.getHttpServer())
      .get('/users/me')
      .set(auth(user.credentials?.accessToken))
      .expect(200);
    expect(res.body._id).toBe(String(user._id));
  });

  it('Пользователь: POST /users -> 403', async () => {
    const user = await signup('user.create.forbidden@test.com', 'secret12');
    await request(ctx.app.getHttpServer())
      .post('/users')
      .set(auth(user.credentials?.accessToken))
      .send({ email: 'cant@test.com', password: 'secret12', username: 'cant' })
      .expect(403);
  });

  it('Пользователь: DELETE /users/:id -> 403', async () => {
    const user = await signup('user.del.actor@test.com', 'secret12');
    const victim = await signup('user.del.victim@test.com', 'secret12');
    await request(ctx.app.getHttpServer())
      .delete(`/users/${victim._id}`)
      .set(auth(user.credentials?.accessToken))
      .expect(403);
  });

  it('Админ: POST /users валидация -> 400', async () => {
    await request(ctx.app.getHttpServer())
      .post('/users')
      .set(auth(adminToken))
      .send({ email: 'bad', password: '123', username: 'x' })
      .expect(400);
  });

  it('Админ: POST /users -> 201', async () => {
    const created = await request(ctx.app.getHttpServer())
      .post('/users')
      .set(auth(adminToken))
      .send({ email: 'ok2@test.com', password: 'secret12', username: 'ok2' })
      .expect(201);
    expect(created.body._id).toBeDefined();
  });

  it('Админ: GET /users -> 200', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/users')
      .set(auth(adminToken))
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Админ: PATCH /users/:id (собственный) -> 200', async () => {
    const res = await request(ctx.app.getHttpServer())
      .patch(`/users/${adminId}`)
      .set(auth(adminToken))
      .send({ username: 'updatedAdmin' })
      .expect(200);
    expect(res.body.username).toBe('updatedAdmin');
  });

  it('Админ: DELETE /users/:id -> 200', async () => {
    const victim = await signup('victim3@test.com', 'secret12');
    await request(ctx.app.getHttpServer())
      .delete(`/users/${victim._id}`)
      .set(auth(adminToken))
      .expect(200);
  });
});
