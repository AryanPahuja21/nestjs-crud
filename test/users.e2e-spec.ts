import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Aryan',
          email: `aryan-${Date.now()}@example.com`,
          password: '123456',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Aryan');
    });

    it('should fail validation for missing fields', async () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ email: 'invalid' })
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return users array', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
