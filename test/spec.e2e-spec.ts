import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import axios from 'axios';
import { useContainer } from 'class-validator';
import { AssessmentLayer } from 'src/assessment/entities/assessment-layer.entity';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { AssessmentType } from 'src/assessment/entities/assessment-type.entity';
import { AssetType } from 'src/asset/entities/asset-type.entity';
import { typeOrmConfig } from 'src/config/typeorm-config';
import { connectionSource } from 'src/config/typeorm-connection-source';
import { Environment } from 'src/environment/entities/environment.entity';
import { Member } from 'src/member/entities/member.entity';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { SpecModule } from 'src/spec/spec.module';
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

describe('SpecController (e2e)', () => {
  let app: INestApplication;

  const token: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTAwYjhkNS1hYTEyLTQ2YjUtYTNkNi04NjRiYTMyZTUyYjMiLCJpYXQiOjE3MzkwMDU0MTYsImV4cCI6MTczOTA5MTgxNn0.iTxZq2QwdUVIbdrD2aWe_QOnJPLKyoLgwZbIA2WcV1k';

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TypeOrmModule.forRoot(typeOrmConfig), SpecModule],
      }).compile();

      app = moduleFixture.createNestApplication();

      app.setGlobalPrefix('sampa/api/v1');
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
        }),
      );
      useContainer(app.select(SpecModule), { fallbackOnErrors: true });
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
    await connectionSource.getRepository(AssetType).delete({});
    await connectionSource.getRepository(Environment).delete({});
    await connectionSource.getRepository(AssessmentType).delete({});
  });

  afterAll(async () => {
    connectionSource.destroy();
  });

  //
  // sampa/api/v1/admin/spec-item (POST)
  //
  it('sampa/api/v1/admin/spec-item (POST) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .post('/sampa/api/v1/admin/spec-item')
      .expect(401);
  });

  it('/sampa/api/v1/admin/spec-item (POST) should return 400', async () => {
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
      .post('/sampa/api/v1/admin/spec-item')
      .set('Authorization', `bearer ${token}`)
      .expect(400);
  });

  it('/sampa/api/v1/admin/spec-item (POST) should return 200', async () => {
    const assetType = await connectionSource
      .getRepository(AssetType)
      .save({ name: 'string' });
    const environment = await connectionSource
      .getRepository(Environment)
      .save({ name: 'string' });
    const assessmentType = await connectionSource
      .getRepository(AssessmentType)
      .save({ name: 'string' });

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
      .post('/sampa/api/v1/admin/spec-item')
      .set('Authorization', `bearer ${token}`)
      .send({
        assetTypeId: assetType.id,
        environmentId: environment.id,
        name: 'string',
        description: 'string',
        value: {},
        isMultiValue: true,
        isOptional: true,
        assessmentTypeIds: [assessmentType.id],
      })
      .expect(201);
  });
  //
  // sampa/api/v1/admin/spec-item (POST)
  //

  //
  // sampa/api/v1/admin/spec-item (GET)
  //
  it('sampa/api/v1/admin/spec-item (GET) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .get('/sampa/api/v1/admin/spec-item')
      .expect(401);
  });

  it('/sampa/api/v1/admin/spec-item (GET) should return 400', async () => {
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
      .get('/sampa/api/v1/admin/spec-item')
      .set('Authorization', `bearer ${token}`)
      .expect(400);
  });

  it('/sampa/api/v1/admin/spec-item (GET) should return 200', async () => {
    const assetType = await connectionSource
      .getRepository(AssetType)
      .save({ name: 'string' });
    const environment = await connectionSource
      .getRepository(Environment)
      .save({ name: 'string' });
    const assessmentType = await connectionSource
      .getRepository(AssessmentType)
      .save({ name: 'string' });
    await connectionSource.getRepository(RequestSpecItem).save({
      assetTypeId: assetType.id,
      environmentId: environment.id,
      name: 'string',
      description: 'string',
      value: '{}',
      isMultiValue: true,
      isOptional: true,
      assessmentTypeIds: [assessmentType.id],
    });

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
      .get('/sampa/api/v1/admin/spec-item?skip=0&take=10')
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
  // sampa/api/v1/admin/spec-item (GET)
  //

  //
  // sampa/api/v1/admin/spec-item/{id} (GET)
  //
  it('sampa/api/v1/admin/spec-item/{id} (GET) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .get('/sampa/api/v1/admin/spec-item/test')
      .expect(401);
  });

  it('sampa/api/v1/admin/spec-item/{id} (GET) should return 200', async () => {
    const assetType = await connectionSource
      .getRepository(AssetType)
      .save({ name: 'string' });
    const environment = await connectionSource
      .getRepository(Environment)
      .save({ name: 'string' });
    const assessmentType = await connectionSource
      .getRepository(AssessmentType)
      .save({ name: 'string' });
    const requestSpecItem = await connectionSource
      .getRepository(RequestSpecItem)
      .save({
        assetTypeId: assetType.id,
        environmentId: environment.id,
        name: 'string',
        description: 'string',
        value: '{}',
        isMultiValue: true,
        isOptional: true,
        assessmentTypeIds: [assessmentType.id],
      });

    const res = await request(app.getHttpServer())
      .get('/sampa/api/v1/admin/spec-item/' + requestSpecItem.id)
      .set('Authorization', `bearer ${token}`)
      .expect(200);

    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBeDefined();
  });
  //
  // sampa/api/v1/admin/spec-item/{id} (GET)
  //

  //
  // sampa/api/v1/admin/spec-item/{id} (Patch)
  //
  it('sampa/api/v1/admin/spec-item/{id} (Patch) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .patch('/sampa/api/v1/admin/spec-item/test')
      .expect(401);
  });

  it('sampa/api/v1/admin/spec-item/{id} (Patch) should return 200', async () => {
    const assetType = await connectionSource
      .getRepository(AssetType)
      .save({ name: 'string' });
    const environment = await connectionSource
      .getRepository(Environment)
      .save({ name: 'string' });
    const assessmentType = await connectionSource
      .getRepository(AssessmentType)
      .save({ name: 'string' });
    const requestSpecItem = await connectionSource
      .getRepository(RequestSpecItem)
      .save({
        assetTypeId: assetType.id,
        environmentId: environment.id,
        name: 'string',
        description: 'string',
        value: '{}',
        isMultiValue: true,
        isOptional: true,
        assessmentTypeIds: [assessmentType.id],
      });

    const res = await request(app.getHttpServer())
      .patch('/sampa/api/v1/admin/spec-item/' + requestSpecItem.id)
      .set('Authorization', `bearer ${token}`)
      .send({ name: 'string2', description: 'string2' })
      .expect(200);

    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBeDefined();
  });
  //
  // sampa/api/v1/admin/spec-item/{id} (Patch)
  //

  //
  // sampa/api/v1/admin/spec-item/{id} (DELETE)
  //
  it('sampa/api/v1/admin/spec-item/{id} (DELETE) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .delete('/sampa/api/v1/admin/spec-item/test')
      .expect(401);
  });

  it('sampa/api/v1/admin/spec-item/{id} (DELETE) should return 200', async () => {
    const assetType = await connectionSource
      .getRepository(AssetType)
      .save({ name: 'string' });
    const environment = await connectionSource
      .getRepository(Environment)
      .save({ name: 'string' });
    const assessmentType = await connectionSource
      .getRepository(AssessmentType)
      .save({ name: 'string' });
    const requestSpecItem = await connectionSource
      .getRepository(RequestSpecItem)
      .save({
        assetTypeId: assetType.id,
        environmentId: environment.id,
        name: 'string',
        description: 'string',
        value: '{}',
        isMultiValue: true,
        isOptional: true,
        assessmentTypeIds: [assessmentType.id],
      });

    await request(app.getHttpServer())
      .delete('/sampa/api/v1/admin/spec-item/' + requestSpecItem.id)
      .set('Authorization', `bearer ${token}`)
      .expect(200);
  });
  //
  // sampa/api/v1/admin/spec-item/{id} (DELETE)
  //
});
