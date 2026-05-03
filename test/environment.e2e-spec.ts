import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import axios from 'axios';
import { useContainer } from 'class-validator';
import { AssessmentLayer } from 'src/assessment/entities/assessment-layer.entity';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { typeOrmConfig } from 'src/config/typeorm-config';
import { connectionSource } from 'src/config/typeorm-connection-source';
import { Environment } from 'src/environment/entities/environment.entity';
import { EnvironmentModule } from 'src/environment/environment.module';
import { Member } from 'src/member/entities/member.entity';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import * as request from 'supertest';
import { userMock } from './mock/user-mock';

jest.mock('axios');
jest.mock('src/vault/vault', () => ({
  Vault: {
    instance: {
      login: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue('mockedValue'),
    },
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EnvironmentController (e2e)', () => {
  let app: INestApplication;

  const token: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTAwYjhkNS1hYTEyLTQ2YjUtYTNkNi04NjRiYTMyZTUyYjMiLCJpYXQiOjE3MzkwMDU0MTYsImV4cCI6MTczOTA5MTgxNn0.iTxZq2QwdUVIbdrD2aWe_QOnJPLKyoLgwZbIA2WcV1k';

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TypeOrmModule.forRoot(typeOrmConfig), EnvironmentModule],
      }).compile();

      app = moduleFixture.createNestApplication();

      app.setGlobalPrefix('sampa/api/v1');
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
        }),
      );
      useContainer(app.select(EnvironmentModule), { fallbackOnErrors: true });
      await app.init();

      await connectionSource.initialize();
    } catch (error) {
      console.log(error);
    }
  });

  beforeAll(async () => {
    await connectionSource.getRepository(AssessmentLayer).delete({});
    await connectionSource.getRepository(AssessmentRequest).delete({});
    await connectionSource.getRepository(Member).delete({});
    await connectionSource.getRepository(Member).save(userMock);
  });

  beforeEach(async () => {
    await connectionSource.getRepository(RequestSpecItem).delete({});
    await connectionSource.getRepository(Environment).delete({});
  });

  afterAll(async () => {
    connectionSource.destroy();
  });

  //
  // sampa/api/v1/admin/environment (POST)
  //
  it('sampa/api/v1/admin/environment (POST) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .post('/sampa/api/v1/admin/environment')
      .expect(401);
  });

  it('/sampa/api/v1/admin/environment (POST) should return 400', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === 'mockedValue/idp/api/v1/users/current-user') {
        return Promise.resolve({
          data: {
            message: 'successful',
            data: userMock,
            statusCode: 200,
          },
        });
      } else {
        return Promise.resolve({});
      }
    });

    await request(app.getHttpServer())
      .post('/sampa/api/v1/admin/environment')
      .set('Authorization', `bearer ${token}`)
      .expect(400);
  });

  it('/sampa/api/v1/admin/environment (POST) should return 200', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === 'mockedValue/idp/api/v1/users/current-user') {
        return Promise.resolve({
          data: {
            message: 'successful',
            data: userMock,
            statusCode: 200,
          },
        });
      } else {
        return Promise.resolve({});
      }
    });

    await request(app.getHttpServer())
      .post('/sampa/api/v1/admin/environment')
      .set('Authorization', `bearer ${token}`)
      .send({
        name: 'string',
      })
      .expect(201);
  });
  //
  // sampa/api/v1/admin/environment (POST)
  //

  //
  // sampa/api/v1/admin/environment (GET)
  //
  it('sampa/api/v1/admin/environment (GET) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .get('/sampa/api/v1/admin/environment')
      .expect(401);
  });

  it('/sampa/api/v1/admin/environment (GET) should return 400', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === 'mockedValue/idp/api/v1/users/current-user') {
        return Promise.resolve({
          data: {
            message: 'successful',
            data: userMock,
            statusCode: 200,
          },
        });
      } else {
        return Promise.resolve({});
      }
    });

    await request(app.getHttpServer())
      .get('/sampa/api/v1/admin/environment')
      .set('Authorization', `bearer ${token}`)
      .expect(400);
  });

  it('/sampa/api/v1/admin/environment (GET) should return 200', async () => {
    await connectionSource.getRepository(Environment).save({ name: 'string' });

    mockedAxios.get.mockImplementation((url) => {
      if (url === 'mockedValue/idp/api/v1/users/current-user') {
        return Promise.resolve({
          data: {
            message: 'successful',
            data: userMock,
            statusCode: 200,
          },
        });
      } else {
        return Promise.resolve({});
      }
    });

    const res = await request(app.getHttpServer())
      .get('/sampa/api/v1/admin/environment?skip=0&take=10')
      .set('Authorization', `bearer ${token}`)
      .expect(200);

    expect(res.body.data.count).toBeDefined();
    expect(typeof res.body.data.count).toBe('number');
    expect(expect(Array.isArray(res.body.data.data)).toBe(true));
    expect(res.body.data.data[0]).toBeDefined();

    expect(res.body.data.data[0].id).toBeDefined();
    expect(res.body.data.data[0].name).toBeDefined();
  });
  //
  // sampa/api/v1/admin/environment (GET)
  //

  //
  // sampa/api/v1/admin/environment/{id} (GET)
  //
  it('sampa/api/v1/admin/environment/{id} (GET) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .get('/sampa/api/v1/admin/environment/test')
      .expect(401);
  });

  it('sampa/api/v1/admin/environment/{id} (GET) should return 200', async () => {
    const environmentType = await connectionSource
      .getRepository(Environment)
      .save({ name: 'string' });

    const res = await request(app.getHttpServer())
      .get('/sampa/api/v1/admin/environment/' + environmentType.id)
      .set('Authorization', `bearer ${token}`)
      .expect(200);

    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBeDefined();
  });
  //
  // sampa/api/v1/admin/environment/{id} (GET)
  //

  //
  // sampa/api/v1/admin/environment/{id} (PATCH)
  //
  it('idp/api/v1/admin/environment/{id} (PATCH) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .patch('/sampa/api/v1/admin/environment/test')
      .expect(401);
  });

  it('idp/api/v1/admin/environment/{id} (PATCH) should return 400 when no body', async () => {
    const environmentType = await connectionSource
      .getRepository(Environment)
      .save({ name: 'string' });

    const res = await request(app.getHttpServer())
      .patch('/sampa/api/v1/admin/environment/' + environmentType.id)
      .set('Authorization', `bearer ${token}`)
      .send({
        name: null,
      })
      .expect(400);

    expect(res.body.message).toBeDefined();
    expect(res.body.error).toBeDefined();

    expect(res.body.message).toStrictEqual([
      'name should not be empty',
      'name must be a string',
    ]);
  });

  it('idp/api/v1/admin/environment/{id} (PATCH) should return 200', async () => {
    const environmentType = await connectionSource
      .getRepository(Environment)
      .save({ name: 'string' });

    const data = {
      name: 'string2',
    };
    const res = await request(app.getHttpServer())
      .patch('/sampa/api/v1/admin/environment/' + environmentType.id)
      .set('Authorization', `bearer ${token}`)
      .send(data)
      .expect(200);

    expect(res.body.data[0].id).toBe(environmentType.id);
    expect(res.body.data[0].name).toBe(data.name);
  });
  //
  // sampa/api/v1/admin/environment/{id} (PATCH)
  //

  //
  // sampa/api/v1/admin/environment/{id} (DELETE)
  //
  it('sampa/api/v1/admin/environment/{id} (DELETE) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .delete('/sampa/api/v1/admin/environment/test')
      .expect(401);
  });

  it('sampa/api/v1/admin/environment/{id} (DELETE) should return 200', async () => {
    const organization = await connectionSource
      .getRepository(Environment)
      .save({ name: 'string', code: 'string' });

    await request(app.getHttpServer())
      .delete('/sampa/api/v1/admin/environment/' + organization.id)
      .set('Authorization', `bearer ${token}`)
      .expect(200);
  });
  //
  // sampa/api/v1/admin/environment/{id} (DELETE)
  //

  //
  // sampa/api/v1/admin/environment (GET)
  //
  it('sampa/api/v1/admin/environment (GET) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .get('/sampa/api/v1/admin/environment')
      .expect(401);
  });

  it('/sampa/api/v1/environment (GET) should return 400', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === 'mockedValue/idp/api/v1/users/current-user') {
        return Promise.resolve({
          data: {
            message: 'successful',
            data: userMock,
            statusCode: 200,
          },
        });
      } else {
        return Promise.resolve({});
      }
    });

    await request(app.getHttpServer())
      .get('/sampa/api/v1/environment')
      .set('Authorization', `bearer ${token}`)
      .expect(400);
  });

  it('/sampa/api/v1/environment (GET) should return 200', async () => {
    await connectionSource.getRepository(Environment).save({ name: 'string' });

    mockedAxios.get.mockImplementation((url) => {
      if (url === 'mockedValue/idp/api/v1/users/current-user') {
        return Promise.resolve({
          data: {
            message: 'successful',
            data: userMock,
            statusCode: 200,
          },
        });
      } else {
        return Promise.resolve({});
      }
    });

    const res = await request(app.getHttpServer())
      .get('/sampa/api/v1/environment?skip=0&take=10')
      .set('Authorization', `bearer ${token}`)
      .expect(200);

    expect(res.body.data.count).toBeDefined();
    expect(typeof res.body.data.count).toBe('number');
    expect(expect(Array.isArray(res.body.data.data)).toBe(true));
    expect(res.body.data.data[0]).toBeDefined();

    expect(res.body.data.data[0].id).toBeDefined();
    expect(res.body.data.data[0].name).toBeDefined();
  });
  //
  // sampa/api/v1/environment (GET)
  //
});
