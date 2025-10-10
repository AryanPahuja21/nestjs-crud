import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/common/enums/role.enum';

describe('Products E2E', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Create admin user for testing
    const adminResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Admin User',
        email: `admin-${Date.now()}@example.com`,
        password: '123456',
        role: Role.ADMIN,
      });
    adminToken = adminResponse.body.access_token;

    // Create regular user for testing
    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Regular User',
        email: `user-${Date.now()}@example.com`,
        password: '123456',
        role: Role.USER,
      });
    userToken = userResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products (POST)', () => {
    it('should create a product with admin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'MacBook Pro',
          description: 'High-end laptop',
          price: 2500,
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe('MacBook Pro');
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Laptop',
          description: 'High-end laptop',
          price: 2000,
        })
        .expect(401);
    });

    it('should reject regular user requests', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Laptop',
          description: 'High-end laptop',
          price: 2000,
        })
        .expect(403);
    });
  });

  describe('/products (GET)', () => {
    it('should return products array for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject unauthenticated GET requests', async () => {
      await request(app.getHttpServer()).get('/products').expect(401);
    });
  });
});
