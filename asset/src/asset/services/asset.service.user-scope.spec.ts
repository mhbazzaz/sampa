import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { I18nService } from 'nestjs-i18n';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { mockAssetTypeRelationRepository } from 'src/asset-type/__mocks__/asset-type-relation.repository';
import { mockAssetTypeRepository } from 'src/asset-type/__mocks__/asset-type.repository';
import { mockAssetTypeVersionRepository } from 'src/asset-type/__mocks__/asset-version.repository';
import { AssetTypeRelationRepository } from 'src/asset-type/repositories/asset-type-relation.repository';
import { AssetTypeVersionRepository } from 'src/asset-type/repositories/asset-type-version.repository';
import { AssetTypeRepository } from 'src/asset-type/repositories/asset-type.repository';
import { AssetRoles } from 'src/common/enums/asset-roles.enum';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { FilterValueRepository } from 'src/filter/repositories/filter-value.repository';
import { LocationTypeRepository } from 'src/location-type/repositories/location-type.repository';
import { LocationRepository } from 'src/location/repositories/location.repository';
import { Role } from 'src/role/entities/role.entity';
import { TagRepository } from 'src/tag/repositories/tag.repository';
import { UsersRepository } from 'src/users/repositories/user.repository';
import { mockAssetRelationRepository } from '../__mocks__/asset-relation.repository';
import { mockAssetVersionRepository } from '../__mocks__/asset-version.repository';
import { mockAssetRepository } from '../__mocks__/asset.repository';
import { findAllAssetReportQueryDto } from '../dto/input/find-all-asset-report.query.dto';
import { AssetRelationRepository } from '../repositories/asset-relation.repository';
import { AssetVersionRepository } from '../repositories/asset-version.repository';
import { AssetRepository } from '../repositories/asset.repository';
import { AssetService } from './asset.service';

jest.mock('axios');
jest.mock('fast-csv', () => ({
  format: jest.fn(() => ({
    pipe: jest.fn().mockReturnThis(),
    write: jest.fn(),
    end: jest.fn(),
  })),
}));
jest.mock('src/vault/vault', () => ({
  Vault: {
    instance: {
      login: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue('mockedValue'),
    },
  },
}));

const mockUser = { id: 'user-1', username: 'jane' } as any;
const mockQuery: findAllAssetReportQueryDto = { skip: 0, take: 10 };
const mockBody: Record<string, unknown> = {
  tags: [] as string[],
  assetTypeId: 'type-1',
  assetTypeVersionId: 'version-1',
};
const mockAsset = {
  id: 'asset-1',
  content: '{}',
  children: [],
  parents: [],
  asset: { name: 'Laptop', externalRefId: 'EXT-1' },
  location: { name: 'HQ', code: 'HQ1', address: 'addr' },
  version: 1,
} as any;

describe('AssetService user scope authorization', () => {
  let service: AssetService;
  let assetVersionRepository: jest.Mocked<AssetVersionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: AssetRepository, useValue: mockAssetRepository },
        {
          provide: AssetTypeVersionRepository,
          useValue: mockAssetTypeVersionRepository,
        },
        { provide: AssetTypeRepository, useValue: mockAssetTypeRepository },
        {
          provide: AssetRelationRepository,
          useValue: mockAssetRelationRepository,
        },
        {
          provide: AssetVersionRepository,
          useValue: mockAssetVersionRepository,
        },
        { provide: ValidationService, useValue: { validate: jest.fn() } },
        { provide: FilterValueRepository, useValue: { findOne: jest.fn() } },
        { provide: UsersRepository, useValue: { save: jest.fn() } },
        {
          provide: AssetTypeRelationRepository,
          useValue: mockAssetTypeRelationRepository,
        },
        { provide: TagRepository, useValue: { findAllFiltered: jest.fn() } },
        { provide: LocationTypeRepository, useValue: { find: jest.fn() } },
        { provide: LocationRepository, useValue: { find: jest.fn() } },
        { provide: ActionLogRepository, useValue: { save: jest.fn() } },
        {
          provide: I18nService,
          useValue: { t: jest.fn().mockImplementation((key) => key) },
        },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
    assetVersionRepository = module.get(AssetVersionRepository);

    jest.clearAllMocks();
    (axios.post as jest.Mock).mockReset();
    (axios.get as jest.Mock).mockReset();

    const reportQuery =
      assetVersionRepository.findAllPaginationWithFilterForReport;
    reportQuery.mockResolvedValue([[mockAsset], 1]);
    assetVersionRepository.findAllPaginationWithFilter.mockResolvedValue([
      [mockAsset],
      1,
    ]);
    mockAssetTypeRepository.findOne.mockResolvedValue({
      id: 'type-1',
      name: 'Laptop Type',
      assetTypeVersions: [{ id: 'version-1', version: 1 }],
    });

    (service as any).transformAssetToReport = jest
      .fn()
      .mockReturnValue({ name: 'Laptop', externalRefId: 'EXT-1' });
  });

  describe('searchUserScope', () => {
    it('does not apply scope filters for asset administrators', async () => {
      const result = await service.searchUserScope(
        mockUser,
        [{ name: AssetRoles.AssetAdministrator }] as Role[],
        mockQuery,
        mockBody as any,
      );

      const queryOptions =
        assetVersionRepository.findAllPaginationWithFilter.mock.calls[0][2];
      expect(queryOptions.supervisorEmployeeIds).toBeUndefined();
      expect(queryOptions.assetUserScopeIds).toBeUndefined();
      expect(result).toEqual({ data: [mockAsset], count: 1 });
    });

    it('applies supervisor employee ids for asset supervisors', async () => {
      (service as any).buildSupervisorScope = jest
        .fn()
        .mockResolvedValue(['emp-1', 'emp-2']);

      await service.searchUserScope(
        mockUser,
        [{ name: AssetRoles.AssetSupervisor }] as Role[],
        mockQuery,
        mockBody as any,
      );

      expect((service as any).buildSupervisorScope).toHaveBeenCalledWith(
        'jane',
        'user-1',
      );
      expect(
        assetVersionRepository.findAllPaginationWithFilter,
      ).toHaveBeenCalledWith(
        undefined,
        [],
        expect.objectContaining({
          supervisorEmployeeIds: ['emp-1', 'emp-2'],
        }),
        undefined,
      );
    });

    it('applies asset user scope ids for asset users without full access', async () => {
      (service as any).buildAssetUserScope = jest
        .fn()
        .mockResolvedValue(['user-1', 'user-2']);

      await service.searchUserScope(
        mockUser,
        [{ name: AssetRoles.AssetUser }] as Role[],
        mockQuery,
        mockBody as any,
      );

      expect((service as any).buildAssetUserScope).toHaveBeenCalledWith(
        'jane',
        'user-1',
      );
      expect(
        assetVersionRepository.findAllPaginationWithFilter,
      ).toHaveBeenCalledWith(
        undefined,
        [],
        expect.objectContaining({
          assetUserScopeIds: ['user-1', 'user-2'],
        }),
        undefined,
      );
    });
  });

  describe('reportUserScope', () => {
    it('does not apply scope filters for asset administrators', async () => {
      const result = await service.reportUserScope(
        mockUser,
        [{ name: AssetRoles.AssetAdministrator }] as Role[],
        mockQuery,
        mockBody as any,
      );

      const queryOptions =
        assetVersionRepository.findAllPaginationWithFilterForReport.mock
          .calls[0][2];
      expect(queryOptions.supervisorEmployeeIds).toBeUndefined();
      expect(queryOptions.assetUserScopeIds).toBeUndefined();
      expect(result).toEqual({
        data: [{ name: 'Laptop', externalRefId: 'EXT-1' }],
        count: 1,
      });
    });

    it('does not apply scope filters for asset auditors', async () => {
      (service as any).buildSupervisorScope = jest.fn();
      (service as any).buildAssetUserScope = jest.fn();

      await service.reportUserScope(
        mockUser,
        [{ name: AssetRoles.AssetAuditor }] as Role[],
        mockQuery,
        mockBody as any,
      );

      expect((service as any).buildSupervisorScope).not.toHaveBeenCalled();
      expect((service as any).buildAssetUserScope).not.toHaveBeenCalled();
      const queryOptions =
        assetVersionRepository.findAllPaginationWithFilterForReport.mock
          .calls[0][2];
      expect(queryOptions.supervisorEmployeeIds).toBeUndefined();
      expect(queryOptions.assetUserScopeIds).toBeUndefined();
    });

    it('applies supervisor employee ids for asset supervisors', async () => {
      (service as any).buildSupervisorScope = jest
        .fn()
        .mockResolvedValue(['emp-1', 'emp-2']);
      (service as any).buildAssetUserScope = jest.fn();

      const result = await service.reportUserScope(
        mockUser,
        [{ name: AssetRoles.AssetSupervisor }] as Role[],
        mockQuery,
        mockBody as any,
      );

      expect((service as any).buildSupervisorScope).toHaveBeenCalledWith(
        'jane',
        'user-1',
      );
      expect((service as any).buildAssetUserScope).not.toHaveBeenCalled();
      expect(
        assetVersionRepository.findAllPaginationWithFilterForReport,
      ).toHaveBeenCalledWith(
        undefined,
        [],
        expect.objectContaining({
          supervisorEmployeeIds: ['emp-1', 'emp-2'],
        }),
        undefined,
      );
      expect(result).toEqual({
        data: [{ name: 'Laptop', externalRefId: 'EXT-1' }],
        count: 1,
      });
    });

    it('applies asset user scope ids for asset users without full access', async () => {
      (service as any).buildAssetUserScope = jest
        .fn()
        .mockResolvedValue(['user-1', 'dept-1']);
      (service as any).buildSupervisorScope = jest.fn();

      const result = await service.reportUserScope(
        mockUser,
        [{ name: AssetRoles.AssetUser }] as Role[],
        mockQuery,
        mockBody as any,
      );

      expect((service as any).buildAssetUserScope).toHaveBeenCalledWith(
        'jane',
        'user-1',
      );
      expect((service as any).buildSupervisorScope).not.toHaveBeenCalled();
      expect(
        assetVersionRepository.findAllPaginationWithFilterForReport,
      ).toHaveBeenCalledWith(
        undefined,
        [],
        expect.objectContaining({
          assetUserScopeIds: ['user-1', 'dept-1'],
        }),
        undefined,
      );
      expect(result).toEqual({
        data: [{ name: 'Laptop', externalRefId: 'EXT-1' }],
        count: 1,
      });
    });

    it('uses supervisor scope instead of asset user scope when both roles are present', async () => {
      (service as any).buildSupervisorScope = jest
        .fn()
        .mockResolvedValue(['emp-1']);
      (service as any).buildAssetUserScope = jest.fn();

      await service.reportUserScope(
        mockUser,
        [
          { name: AssetRoles.AssetSupervisor },
          { name: AssetRoles.AssetUser },
        ] as Role[],
        mockQuery,
        mockBody as any,
      );

      expect((service as any).buildSupervisorScope).toHaveBeenCalledWith(
        'jane',
        'user-1',
      );
      expect((service as any).buildAssetUserScope).not.toHaveBeenCalled();
      const queryOptions =
        assetVersionRepository.findAllPaginationWithFilterForReport.mock
          .calls[0][2];
      expect(queryOptions.supervisorEmployeeIds).toEqual(['emp-1']);
      expect(queryOptions.assetUserScopeIds).toBeUndefined();
    });

    it('returns transformed report rows with the scoped result count', async () => {
      const secondAsset = { ...mockAsset, id: 'asset-2' };
      const reportQuery =
        assetVersionRepository.findAllPaginationWithFilterForReport;
      reportQuery.mockResolvedValue([[mockAsset, secondAsset], 2]);
      (service as any).transformAssetToReport = jest
        .fn()
        .mockImplementation((asset) => ({ id: asset.id, name: 'Laptop' }));

      const result = await service.reportUserScope(
        mockUser,
        [{ name: AssetRoles.AssetAuditor }] as Role[],
        mockQuery,
        mockBody as any,
      );

      expect(result).toEqual({
        data: [
          { id: 'asset-1', name: 'Laptop' },
          { id: 'asset-2', name: 'Laptop' },
        ],
        count: 2,
      });
    });
  });

  describe('reportUserScopeFile', () => {
    const mockRes = { setHeader: jest.fn() } as any;

    async function exportCsv(roles: Role[]) {
      await service.reportUserScopeFile(
        mockUser,
        roles,
        mockBody as any,
        mockRes,
        'csv',
      );
    }

    it('does not apply scope filters for asset administrators', async () => {
      await exportCsv([{ name: AssetRoles.AssetAdministrator }] as Role[]);

      const queryOptions =
        assetVersionRepository.findAllPaginationWithFilterForReport.mock
          .calls[0][2];
      expect(queryOptions.supervisorEmployeeIds).toBeUndefined();
      expect(queryOptions.assetUserScopeIds).toBeUndefined();
    });

    it('does not apply scope filters for asset auditors', async () => {
      (service as any).buildSupervisorScope = jest.fn();
      (service as any).buildAssetUserScope = jest.fn();

      await exportCsv([{ name: AssetRoles.AssetAuditor }] as Role[]);

      expect((service as any).buildSupervisorScope).not.toHaveBeenCalled();
      expect((service as any).buildAssetUserScope).not.toHaveBeenCalled();
      const queryOptions =
        assetVersionRepository.findAllPaginationWithFilterForReport.mock
          .calls[0][2];
      expect(queryOptions.supervisorEmployeeIds).toBeUndefined();
      expect(queryOptions.assetUserScopeIds).toBeUndefined();
    });

    it('applies supervisor employee ids for asset supervisors', async () => {
      (service as any).buildSupervisorScope = jest
        .fn()
        .mockResolvedValue(['emp-1', 'emp-2']);
      (service as any).buildAssetUserScope = jest.fn();

      await exportCsv([{ name: AssetRoles.AssetSupervisor }] as Role[]);

      expect((service as any).buildSupervisorScope).toHaveBeenCalledWith(
        'jane',
        'user-1',
      );
      expect((service as any).buildAssetUserScope).not.toHaveBeenCalled();
      expect(
        assetVersionRepository.findAllPaginationWithFilterForReport,
      ).toHaveBeenCalledWith(
        undefined,
        [],
        expect.objectContaining({
          supervisorEmployeeIds: ['emp-1', 'emp-2'],
        }),
        undefined,
      );
    });

    it('applies asset user scope ids for asset users without full access', async () => {
      (service as any).buildAssetUserScope = jest
        .fn()
        .mockResolvedValue(['user-1', 'dept-1']);
      (service as any).buildSupervisorScope = jest.fn();

      await exportCsv([{ name: AssetRoles.AssetUser }] as Role[]);

      expect((service as any).buildAssetUserScope).toHaveBeenCalledWith(
        'jane',
        'user-1',
      );
      expect((service as any).buildSupervisorScope).not.toHaveBeenCalled();
      expect(
        assetVersionRepository.findAllPaginationWithFilterForReport,
      ).toHaveBeenCalledWith(
        undefined,
        [],
        expect.objectContaining({
          assetUserScopeIds: ['user-1', 'dept-1'],
        }),
        undefined,
      );
    });

    it('uses supervisor scope instead of asset user scope when both roles are present', async () => {
      (service as any).buildSupervisorScope = jest
        .fn()
        .mockResolvedValue(['emp-1']);
      (service as any).buildAssetUserScope = jest.fn();

      await exportCsv([
        { name: AssetRoles.AssetSupervisor },
        { name: AssetRoles.AssetUser },
      ] as Role[]);

      expect((service as any).buildSupervisorScope).toHaveBeenCalledWith(
        'jane',
        'user-1',
      );
      expect((service as any).buildAssetUserScope).not.toHaveBeenCalled();
      const queryOptions =
        assetVersionRepository.findAllPaginationWithFilterForReport.mock
          .calls[0][2];
      expect(queryOptions.supervisorEmployeeIds).toEqual(['emp-1']);
      expect(queryOptions.assetUserScopeIds).toBeUndefined();
    });
  });

  describe('subordinate scope helpers', () => {
    const supervisorUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const reportUserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const nestedReportUserId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const departmentPeerUserId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

    it('matches nested reports even when ManagerId and EmployeeId types differ', () => {
      const users = [
        {
          EmployeeId: 2,
          ManagerId: 1,
          idpUserId: reportUserId,
        },
        {
          EmployeeId: '3',
          ManagerId: '2',
          idpUserId: nestedReportUserId,
        },
        {
          EmployeeId: '4',
          ManagerId: '99',
          idpUserId: departmentPeerUserId,
        },
      ];

      const managed = service.getAllManagedUsers('1', users);

      expect(managed.map((user) => user.idpUserId)).toEqual([
        reportUserId,
        nestedReportUserId,
      ]);
    });

    it('unwraps nested IDP employee payloads', () => {
      expect(service.unwrapEmployeeList({ data: [{ EmployeeId: '1' }] })).toEqual(
        [{ EmployeeId: '1' }],
      );
      expect(
        service.unwrapEmployeeList({ data: { data: [{ EmployeeId: '1' }] } }),
      ).toEqual([{ EmployeeId: '1' }]);
      expect(service.unwrapEmployeeList([{ EmployeeId: '1' }])).toEqual([
        { EmployeeId: '1' },
      ]);
    });

    it('formats report column headers from content keys', () => {
      expect(service.formatReportColumnHeader('externalRefId')).toBe(
        'External Ref Id',
      );
      expect(service.formatReportColumnHeader('location_code')).toBe(
        'Location Code',
      );
      expect(service.formatReportColumnHeader('content.ipAddress')).toBe(
        'Content Ip Address',
      );
    });

    it('extracts UUID ids used on accountable and responsible asset fields', () => {
      expect(
        service.extractEmployeeScopeId({
          EmployeeId: '123',
          idpUserId: supervisorUserId,
        }),
      ).toBe(supervisorUserId);
      expect(service.extractEmployeeScopeId({ EmployeeId: '123' })).toBeUndefined();
    });

    it('returns reporting-line and department subordinate user ids', async () => {
      (axios.get as jest.Mock).mockImplementation(
        (url: string, config?: { params?: Record<string, unknown> }) => {
          if (url.includes('get-downward-department')) {
            return Promise.resolve({ data: { data: [] } });
          }

          const params = config?.params || {};
          if (params.ADUserName) {
            return Promise.resolve({
              data: {
                data: [
                  {
                    EmployeeId: '1',
                    DepartmentId: 'd1',
                    idpUserId: supervisorUserId,
                    ManagerId: null,
                  },
                ],
              },
            });
          }

          return Promise.resolve({
            data: {
              data: [
                {
                  EmployeeId: '1',
                  DepartmentId: 'd1',
                  idpUserId: supervisorUserId,
                },
                {
                  EmployeeId: 2,
                  DepartmentId: 'd1',
                  ManagerId: '1',
                  idpUserId: reportUserId,
                },
                {
                  EmployeeId: '3',
                  DepartmentId: 'd1',
                  ManagerId: '99',
                  idpUserId: departmentPeerUserId,
                },
              ],
            },
          });
        },
      );

      const ids = await service.getSubordinateUsers('jane');

      expect(ids).toEqual(
        expect.arrayContaining([reportUserId, departmentPeerUserId]),
      );
    });
  });
});
