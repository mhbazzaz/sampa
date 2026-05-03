import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import axios from 'axios';
import { useContainer } from 'class-validator';
import { AssessmentModule } from 'src/assessment/assessment.module';
import { AssessmentLayer } from 'src/assessment/entities/assessment-layer.entity';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { AssessmentType } from 'src/assessment/entities/assessment-type.entity';
import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';
import { AssetType } from 'src/asset/entities/asset-type.entity';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { typeOrmConfig } from 'src/config/typeorm-config';
import { connectionSource } from 'src/config/typeorm-connection-source';
import { ProcessSeeder } from 'src/database/seeder/process';
import { StateSeeder } from 'src/database/seeder/state';
import { GroupMembership } from 'src/group-membership/entities/group-membership.entity';
import { Group } from 'src/group/entities/group.entity';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
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
const mock_AuthorizationGuard = { CanActivate: jest.fn(() => true) };
const mock_MemberRepository = {
  findCiso: jest.fn(() => {
    return {
      id: 'a40d92c4-cd4c-4a9c-8392-588f7be07709',
    };
  }),
};

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AssetController (e2e)', () => {
  let app: INestApplication;

  const token: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTAwYjhkNS1hYTEyLTQ2YjUtYTNkNi04NjRiYTMyZTUyYjMiLCJpYXQiOjE3MzkwMDU0MTYsImV4cCI6MTczOTA5MTgxNn0.iTxZq2QwdUVIbdrD2aWe_QOnJPLKyoLgwZbIA2WcV1k';

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TypeOrmModule.forRoot(typeOrmConfig), AssessmentModule],
      })
        .overrideGuard(AuthorizationGuard)
        .useValue(mock_AuthorizationGuard)
        .overrideProvider(MemberRepository)
        .useValue(mock_MemberRepository)
        .compile();

      app = moduleFixture.createNestApplication();

      app.setGlobalPrefix('sampa/api/v1');
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
        }),
      );
      useContainer(app.select(AssessmentModule), { fallbackOnErrors: true });
      await app.init();

      await connectionSource.initialize();
    } catch (error) {
      console.log(error);
    }
  });

  beforeAll(async () => {
    await connectionSource.getRepository(AssessmentLayer).delete({});
    await connectionSource.getRepository(AssessmentType).delete({});
    await connectionSource.getRepository(AssessmentRequest).delete({});
    await connectionSource.getRepository(GroupMembership).delete({});
    await connectionSource.getRepository(Group).delete({});
    await connectionSource.getRepository(AssetToAudit).delete({});
    await connectionSource.getRepository(Member).delete({});
    await connectionSource.getRepository(Member).save(userMock);
  });

  beforeEach(async () => {
    await connectionSource.getRepository(RequestSpecItem).delete({});
    await connectionSource.getRepository(AssetType).delete({});
  });

  afterAll(async () => {
    connectionSource.destroy();
  });

  //
  // sampa/api/v1/assessment/new-request (POST)
  //
  it('sampa/api/v1/assessment/new-request (POST) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .post('/sampa/api/v1/assessment/new-request')
      .expect(401);
  });

  it('/sampa/api/v1/assessment/new-request (POST) should return 400', async () => {
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
      .post('/sampa/api/v1/assessment/new-request')
      .set('Authorization', `bearer ${token}`)
      .expect(400);
  });

  it('/sampa/api/v1/assessment/new-request (POST) should return 200', async () => {
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

    const assessmentType = await connectionSource
      .getRepository(AssessmentType)
      .save({ name: 'string' });
    const assetToAudit = await connectionSource
      .getRepository(AssetToAudit)
      .save({ title: 'string', baseline: 'string' });
    await ProcessSeeder(connectionSource);
    await StateSeeder(connectionSource);

    await request(app.getHttpServer())
      .post('/sampa/api/v1/assessment/new-request')
      .set('Authorization', `bearer ${token}`)
      .send({
        assetReferenceId: assetToAudit.id,
        environmentName: 'string',
        assetToAuditBaseline: 'string',
        assessmentTypeIds: [assessmentType.id],
      })
      .expect(201);
  });
  //
  // sampa/api/v1/assessment/new-request (POST)
  //

  //
  // sampa/api/v1/assessment (GET)
  //
  it('sampa/api/v1/assessment (GET) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .get('/sampa/api/v1/assessment')
      .expect(401);
  });

  it('/sampa/api/v1/assessment (GET) should return 200', async () => {
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
      .get('/sampa/api/v1/assessment?skip=0&take=10')
      .set('Authorization', `bearer ${token}`)
      .expect(200);

    expect(res.body.data.count).toBeDefined();
    expect(typeof res.body.data.count).toBe('number');
    expect(expect(Array.isArray(res.body.data.data)).toBe(true));
  });
  //
  // sampa/api/v1/assessment (GET)
  //

  //
  // sampa/api/v1/assessment (GET)
  //
  it('sampa/api/v1/assessment/{id} (GET) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .get('/sampa/api/v1/assessment/id')
      .expect(401);
  });

  it('/sampa/api/v1/assessment/{id} (GET) should return 200', async () => {
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
      .get('/sampa/api/v1/assessment/0c905cf8-b0eb-41e6-986a-f5c7e780511f')
      .set('Authorization', `bearer ${token}`)
      .expect(404);
  });
  //
  // sampa/api/v1/assessment (GET)
  //
});
