import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import axios from 'axios';
import { useContainer } from 'class-validator';
import { AssessmentLayer } from 'src/assessment/entities/assessment-layer.entity';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { typeOrmConfig } from 'src/config/typeorm-config';
import { connectionSource } from 'src/config/typeorm-connection-source';
import { GroupMembership } from 'src/group-membership/entities/group-membership.entity';
import { GroupMembershipModule } from 'src/group-membership/group-membership.module';
import { Group } from 'src/group/entities/group.entity';
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

describe('GroupMembershipsController (e2e)', () => {
  let app: INestApplication;

  const token: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTAwYjhkNS1hYTEyLTQ2YjUtYTNkNi04NjRiYTMyZTUyYjMiLCJpYXQiOjE3MzkwMDU0MTYsImV4cCI6MTczOTA5MTgxNn0.iTxZq2QwdUVIbdrD2aWe_QOnJPLKyoLgwZbIA2WcV1k';

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TypeOrmModule.forRoot(typeOrmConfig), GroupMembershipModule],
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
      useContainer(app.select(GroupMembershipModule), {
        fallbackOnErrors: true,
      });
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
    await connectionSource.getRepository(GroupMembership).delete({});
    await connectionSource.getRepository(Group).delete({});
    await connectionSource.getRepository(Member).save(userMock);
  });

  afterAll(async () => {
    connectionSource.destroy();
  });

  it('sampa/api/v1/group-membership (Post) should return 401 when no token', async () => {
    await request(app.getHttpServer())
      .post('/sampa/api/v1/group-membership')
      .expect(401);
  });

  it('/sampa/api/v1/group-membership (Post) should return 400', async () => {
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
      .post('/sampa/api/v1/group-membership')
      .set('Authorization', `bearer ${token}`)
      .expect(400);
  });

  it('/sampa/api/v1/group-membership (Post) should return 200', async () => {
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

    const group = await connectionSource
      .getRepository(Group)
      .save({ name: 'string' });
    const member = await connectionSource.getRepository(Member).save({});

    await request(app.getHttpServer())
      .post('/sampa/api/v1/group-membership')
      .set('Authorization', `bearer ${token}`)
      .send({
        usersData: [
          {
            userId: member.id,
            isMember: true,
            isLead: true,
          },
        ],
        groupId: group.id,
      })
      .expect(201);
  });
});
