import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth E2E', () => {
  let app: INestApplication;
  const testEmail = `aryan-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Create a user and get token directly from registration
    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Aryan',
        email: testEmail,
        password: '123456',
      })
      .expect(201);
  });

  it('should login and return a JWT token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: '123456',
      })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    expect(typeof res.body.access_token).toBe('string');
  });

  it('should access protected route with token from registration', async () => {
    // Create admin user for testing protected routes that require admin role
    const adminResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Admin',
        email: `admin-${Date.now()}@example.com`,
        password: '123456',
        role: 'admin',
      })
      .expect(201);

    const adminToken = adminResponse.body.access_token;

    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'MacBook Pro',
        description: 'High-end laptop',
        price: 2500,
      })
      .expect(201);

    expect(res.body.name).toBe('MacBook Pro');
  });

  afterAll(async () => {
    await app.close();
  });
});
