import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/common/enums/role.enum';

describe('Role-based Access Control E2E', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let moderatorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Create regular user
    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Regular User',
        email: `user-${Date.now()}@example.com`,
        password: '123456',
        role: Role.USER,
      })
      .expect(201);
    userToken = userResponse.body.access_token;

    // Create admin user
    const adminResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Admin User',
        email: `admin-${Date.now()}@example.com`,
        password: '123456',
        role: Role.ADMIN,
      })
      .expect(201);
    adminToken = adminResponse.body.access_token;

    // Create moderator user
    const moderatorResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Moderator User',
        email: `moderator-${Date.now()}@example.com`,
        password: '123456',
        role: Role.MODERATOR,
      })
      .expect(201);
    moderatorToken = moderatorResponse.body.access_token;
  });

  describe('User Management (Admin Only)', () => {
    it('should allow admin to get all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny regular user access to get all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should deny moderator access to get all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);
    });
  });

  describe('Product Management', () => {
    it('should allow admin to create products', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Product',
          description: 'Product created by admin',
          price: 100,
        })
        .expect(201);
    });

    it('should allow moderator to create products', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          name: 'Moderator Product',
          description: 'Product created by moderator',
          price: 200,
        })
        .expect(201);
    });

    it('should deny regular user to create products', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'User Product',
          description: 'Product created by user',
          price: 50,
        })
        .expect(403);
    });

    it('should allow all authenticated users to view products', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
