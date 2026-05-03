import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import axios from 'axios';
import { useContainer } from 'class-validator';
import { AssessmentLayer } from 'src/assessment/entities/assessment-layer.entity';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { typeOrmConfig } from 'src/config/typeorm-config';
import { connectionSource } from 'src/config/typeorm-connection-source';
import { Member } from 'src/member/entities/member.entity';
import { MemberModule } from 'src/member/member.module';
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

describe('MembersController (e2e)', () => {
  let app: INestApplication;

  const token: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTAwYjhkNS1hYTEyLTQ2YjUtYTNkNi04NjRiYTMyZTUyYjMiLCJpYXQiOjE3MzkwMDU0MTYsImV4cCI6MTczOTA5MTgxNn0.iTxZq2QwdUVIbdrD2aWe_QOnJPLKyoLgwZbIA2WcV1k';

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TypeOrmModule.forRoot(typeOrmConfig), MemberModule],
      }).compile();

      app = moduleFixture.createNestApplication();

      app.setGlobalPrefix('sampa/api/v1');
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
        }),
      );
      useContainer(app.select(MemberModule), { fallbackOnErrors: true });
      await app.init();

      await connectionSource.initialize();
    } catch (error) {
      console.log(error);
    }
  });

  beforeEach(async () => {
    await connectionSource.getRepository(AssessmentLayer).delete({});
    await connectionSource.getRepository(AssessmentRequest).delete({});
    await connectionSource.getRepository(Member).delete({});
    await connectionSource.getRepository(Member).save(userMock);
  });

  afterAll(async () => {
    connectionSource.destroy();
  });

  //
  // sampa/api/v1/member/current-member
  //
  it('sampa/api/v1/member/current-member (GET) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .get('/sampa/api/v1/member/current-member')
      .expect(401);
  });

  it('/sampa/api/v1/member/current-member (GET) should return 200', async () => {
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
      .get('/sampa/api/v1/member/current-member')
      .set('Authorization', `bearer ${token}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
  });
  //
  // sampa/api/v1/member/current-member
  //
});
