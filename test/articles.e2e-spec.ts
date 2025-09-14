import * as request from 'supertest';
import { E2EContext } from './helpers/e2e-setup';

describe('Articles (e2e)', () => {
  const ctx = new E2EContext();
  let adminId: string;
  let adminToken: string;
  let userId: string;
  let userToken: string;

  beforeAll(async () => {
    await ctx.start();
    await ctx.seedArticles();
    const admin = await ctx.createAdmin('admin@app.test');
    adminId = admin.id;
    adminToken = admin.accessToken;
    const regular = await ctx.createUser('user@app.test');
    userId = regular.id;
    userToken = regular.accessToken;
  });

  afterAll(async () => {
    await ctx.stop();
  });

  it('GET /articles возвращает массив', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/articles')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    const titles = res.body.map((a: any) => a.title);
    expect(titles).toEqual(
      expect.arrayContaining(['Nest intro', 'Mongo tips']),
    );
  });

  it('GET /articles фильтрует по тегам (ИЛИ)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/articles?tags=nest,mongo')
      .expect(200);
    const titles = res.body.map((a: any) => a.title);
    expect(titles).toEqual(
      expect.arrayContaining(['Nest intro', 'Mongo tips']),
    );
  });

  it('GET /articles (гость) возвращает только публичные', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/articles')
      .expect(200);
    const titles = res.body.map((a: any) => a.title);
    expect(titles).toEqual(
      expect.arrayContaining(['Nest intro', 'Mongo tips']),
    );
    expect(titles).not.toEqual(expect.arrayContaining(['Private note']));
  });

  async function signup(email: string, password: string) {
    const resp = await request(ctx.app.getHttpServer())
      .post('/signup')
      .send({ email, password, username: email })
      .expect(201);
    return resp.body;
  }

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  it('POST /articles требует авторизацию', async () => {
    await request(ctx.app.getHttpServer())
      .post('/articles')
      .send({ title: 'Unauthorized', body: '...', isPublic: true })
      .expect(401);
  });

  it('POST /articles валидирует DTO (400)', async () => {
    const u = await signup('u1@test.com', 'secret12');
    const token = u.credentials?.accessToken;
    await request(ctx.app.getHttpServer())
      .post('/articles')
      .set(auth(token))
      .send({ title: 'A', isPublic: true }) // too short
      .expect(400);
  });

  let createdId: string;

  it('POST /articles создаёт статью с автором', async () => {
    const u = await signup('owner@test.com', 'secret12');
    const token = u.credentials?.accessToken;
    const res = await request(ctx.app.getHttpServer())
      .post('/articles')
      .set(auth(token))
      .send({ title: 'Owned', body: 'b', tags: ['mine'], isPublic: false })
      .expect(201);
    createdId = res.body._id;
    expect(res.body.author).toBeDefined();
  });

  it('GET /articles (предсозданный пользователь) видит также приватные', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/articles')
      .set(auth(userToken))
      .expect(200);
    const titles = res.body.map((a: any) => a.title);
    expect(titles).toEqual(expect.arrayContaining(['Private note']));
  });

  it('PATCH /articles/:id — владелец может, чужому 403', async () => {
    const owner = await signup('owner2@test.com', 'secret12');
    const ownerToken = owner.credentials?.accessToken;
    // create by owner2
    const created = await request(ctx.app.getHttpServer())
      .post('/articles')
      .set(auth(ownerToken))
      .send({ title: 'EditMe', isPublic: false })
      .expect(201);
    const id = created.body._id;

    // another user tries to update
    const other = await signup('other@test.com', 'secret12');
    const otherToken = other.credentials?.accessToken;
    await request(ctx.app.getHttpServer())
      .patch(`/articles/${id}`)
      .set(auth(otherToken))
      .send({ title: 'Hacked' })
      .expect(403);

    // owner updates successfully
    const upd = await request(ctx.app.getHttpServer())
      .patch(`/articles/${id}`)
      .set(auth(ownerToken))
      .send({ title: 'Edited' })
      .expect(200);
    expect(upd.body.title).toBe('Edited');
  });

  it('DELETE /articles/:id — владелец может, чужому 403', async () => {
    const owner = await signup('owner3@test.com', 'secret12');
    const ownerToken = owner.credentials?.accessToken;
    const created = await request(ctx.app.getHttpServer())
      .post('/articles')
      .set(auth(ownerToken))
      .send({ title: 'ToDelete', isPublic: false })
      .expect(201);
    const id = created.body._id;

    const other = await signup('other3@test.com', 'secret12');
    const otherToken = other.credentials?.accessToken;
    await request(ctx.app.getHttpServer())
      .delete(`/articles/${id}`)
      .set(auth(otherToken))
      .expect(403);

    await request(ctx.app.getHttpServer())
      .delete(`/articles/${id}`)
      .set(auth(ownerToken))
      .expect(200);
  });

  it('PATCH /articles/:id — админ может изменить чужую статью', async () => {
    // user creates article
    const created = await request(ctx.app.getHttpServer())
      .post('/articles')
      .set(auth(userToken))
      .send({ title: 'ToAdminEdit', isPublic: false })
      .expect(201);
    const id = created.body._id;

    // admin updates successfully
    const upd = await request(ctx.app.getHttpServer())
      .patch(`/articles/${id}`)
      .set(auth(adminToken))
      .send({ title: 'AdminEdited' })
      .expect(200);
    expect(upd.body.title).toBe('AdminEdited');
  });

  it('DELETE /articles/:id — админ может удалить чужую статью, пользователь не может', async () => {
    // admin creates article
    const created = await request(ctx.app.getHttpServer())
      .post('/articles')
      .set(auth(adminToken))
      .send({ title: 'AdminOwn', isPublic: false })
      .expect(201);
    const id = created.body._id;

    // user tries to delete -> 403
    await request(ctx.app.getHttpServer())
      .delete(`/articles/${id}`)
      .set(auth(userToken))
      .expect(403);

    // admin deletes -> 200
    await request(ctx.app.getHttpServer())
      .delete(`/articles/${id}`)
      .set(auth(adminToken))
      .expect(200);
  });
});
