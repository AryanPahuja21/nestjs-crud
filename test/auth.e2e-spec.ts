import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth E2E', () => {
  let app: INestApplication;
  let token: string;
  const testEmail = `aryan-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Create a user and get token directly from registration
    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Aryan',
        email: testEmail,
        password: '123456',
      })
      .expect(201);

    token = userResponse.body.access_token;
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
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
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
