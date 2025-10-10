import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/common/enums/role.enum';

describe('Users E2E', () => {
  let app: INestApplication;
  let adminToken: string;
  let createdUserId: number;

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
    it('should create a user and return JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Admin User',
          email: `admin-${Date.now()}@example.com`,
          password: '123456',
          role: Role.ADMIN,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.name).toBe('Admin User');
      expect(response.body.user).not.toHaveProperty('password'); // Password should not be in response
      expect(response.body.user.role).toBe(Role.ADMIN);
      expect(typeof response.body.access_token).toBe('string');

      adminToken = response.body.access_token;
      createdUserId = response.body.user.id;
    });

    it('should create a regular user with default role', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Regular User',
          email: `user-${Date.now()}@example.com`,
          password: '123456',
        })
        .expect(201);

      expect(response.body.user.role).toBe(Role.USER); // Default role
    });

    it('should fail validation for missing fields', async () => {
      return request(app.getHttpServer()).post('/users').send({ email: 'invalid' }).expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return users array for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject unauthenticated GET requests', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return user by ID for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.id).toBe(createdUserId);
    });
  });
});
