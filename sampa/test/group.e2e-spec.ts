import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import axios from 'axios';
import { useContainer } from 'class-validator';
import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { typeOrmConfig } from 'src/config/typeorm-config';
import { connectionSource } from 'src/config/typeorm-connection-source';
import { GroupMembership } from 'src/group-membership/entities/group-membership.entity';
import { Group } from 'src/group/entities/group.entity';
import { GroupModule } from 'src/group/group.module';
import { Member } from 'src/member/entities/member.entity';
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
const mock_AuthorizationGuard = { CanActivate: jest.fn(() => true) };

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GroupsController (e2e)', () => {
  let app: INestApplication;

  const token: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTAwYjhkNS1hYTEyLTQ2YjUtYTNkNi04NjRiYTMyZTUyYjMiLCJpYXQiOjE3MzkwMDU0MTYsImV4cCI6MTczOTA5MTgxNn0.iTxZq2QwdUVIbdrD2aWe_QOnJPLKyoLgwZbIA2WcV1k';

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TypeOrmModule.forRoot(typeOrmConfig), GroupModule],
      })
        .overrideGuard(AuthorizationGuard)
        .useValue(mock_AuthorizationGuard)
        .compile();

      app = moduleFixture.createNestApplication();

      app.setGlobalPrefix('sampa/api/v1');
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
        }),
      );
      useContainer(app.select(GroupModule), { fallbackOnErrors: true });
      await app.init();

      await connectionSource.initialize();
    } catch (error) {
      console.log(error);
    }
  });

  beforeEach(async () => {
    await connectionSource.getRepository(Member).delete({});
    await connectionSource.getRepository(GroupMembership).delete({});
    await connectionSource.getRepository(Group).delete({});
    await connectionSource.getRepository(AssetToAudit).delete({});
    await connectionSource.getRepository(Member).save(userMock);
  });

  afterAll(async () => {
    connectionSource.destroy();
  });

  it('sampa/api/v1/group (GET) should return 401 when no token', async () => {
    await request(app.getHttpServer()).get('/sampa/api/v1/group').expect(401);
  });

  it('/sampa/api/v1/group (GET) should return 400', async () => {
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
      .get('/sampa/api/v1/group')
      .set('Authorization', `bearer ${token}`)
      .expect(400);
  });

  it('/sampa/api/v1/group (GET) should return 200', async () => {
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
      .get('/sampa/api/v1/group?skip=0&take=10')
      .set('Authorization', `bearer ${token}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
  });

  it('sampa/api/v1/group (Post) should return 401 when no token', async () => {
    await request(app.getHttpServer()).post('/sampa/api/v1/group').expect(401);
  });

  it('/sampa/api/v1/group (Post) should return 400', async () => {
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
      .post('/sampa/api/v1/group')
      .set('Authorization', `bearer ${token}`)
      .expect(400);
  });

  it('/sampa/api/v1/group (Post) should return 200', async () => {
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
    const member = await connectionSource.getRepository(Member).save({});
    const asset = await connectionSource
      .getRepository(AssetToAudit)
      .save({ title: 'string', baseline: 'string' });

    await request(app.getHttpServer())
      .post('/sampa/api/v1/group?skip=0&take=10')
      .set('Authorization', `bearer ${token}`)
      .send({
        assetReferenceId: asset.id,
        applicantManagerId: member.id,
        bindingType: 'request-based',
      })
      .expect(201);
  });
});
