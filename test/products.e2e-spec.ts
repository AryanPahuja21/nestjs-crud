import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Products E2E', () => {
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

  describe('/products (POST)', () => {
    it('should create a product', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Laptop',
          description: 'High-end laptop',
          price: 2000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe('Laptop');
    });
  });

  describe('/products (GET)', () => {
    it('should return products array', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
