import { Test, TestingModule } from '@nestjs/testing';
import * as ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
import { I18nService } from 'nestjs-i18n';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { mockAssetTypeRelationRepository } from 'src/asset-type/__mocks__/asset-type-relation.repository';
import { mockAssetTypeRepository } from 'src/asset-type/__mocks__/asset-type.repository';
import { mockAssetTypeVersionRepository } from 'src/asset-type/__mocks__/asset-version.repository';
import { AssetTypeRelationRepository } from 'src/asset-type/repositories/asset-type-relation.repository';
import { AssetTypeVersionRepository } from 'src/asset-type/repositories/asset-type-version.repository';
import { AssetTypeRepository } from 'src/asset-type/repositories/asset-type.repository';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { FilterValueRepository } from 'src/filter/repositories/filter-value.repository';
import { LocationTypeRepository } from 'src/location-type/repositories/location-type.repository';
import { LocationRepository } from 'src/location/repositories/location.repository';
import { TagRepository } from 'src/tag/repositories/tag.repository';
import { UsersRepository } from 'src/users/repositories/user.repository';
import { mockAssetRelationRepository } from '../__mocks__/asset-relation.repository';
import { mockAssetVersionRepository } from '../__mocks__/asset-version.repository';
import { mockAssetRepository } from '../__mocks__/asset.repository';
import { AssetRelationRepository } from '../repositories/asset-relation.repository';
import { AssetVersionRepository } from '../repositories/asset-version.repository';
import { AssetRepository } from '../repositories/asset.repository';
import { AssetService } from './asset.service';

jest.mock('src/vault/vault', () => ({
  Vault: {
    instance: {
      login: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue('mockedValue'),
    },
  },
}));

async function writeWorkbookToBuffer(
  write: (workbook: ExcelJS.stream.xlsx.WorkbookWriter) => Promise<void>,
): Promise<ExcelJS.Workbook> {
  const chunks: Buffer[] = [];
  const stream = new PassThrough();
  stream.on('data', (chunk) => chunks.push(chunk as Buffer));
  const finished = new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream,
    useStyles: true,
  });
  await write(workbook);
  await workbook.commit();
  await finished;

  const reader = new ExcelJS.Workbook();
  await reader.xlsx.load(Buffer.concat(chunks) as any);
  return reader;
}

describe('AssetService excel report styling', () => {
  let service: AssetService;

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
  });

  it('uses wider minimum widths for Name, External Ref Id, Location Address and Model', () => {
    expect(service.getExcelReportColumnMinWidth('name')).toBeGreaterThanOrEqual(
      36,
    );
    expect(
      service.getExcelReportColumnMinWidth('externalRefId'),
    ).toBeGreaterThanOrEqual(32);
    expect(
      service.getExcelReportColumnMinWidth('location_address'),
    ).toBeGreaterThanOrEqual(50);
    expect(
      service.getExcelReportColumnMinWidth('model'),
    ).toBeGreaterThanOrEqual(28);
    expect(
      service.getExcelReportColumnMinWidth('content.model'),
    ).toBeGreaterThanOrEqual(28);
    expect(
      service.getExcelReportColumnMinWidth('version'),
    ).toBeGreaterThanOrEqual(14);
  });

  it('styles the Info sheet with a title banner, generated date and centered filter rows', async () => {
    const workbook = await writeWorkbookToBuffer(async (writer) => {
      await (service as any).writeExcelReportInfoSheet(writer, {
        title: 'Servers',
        rows: [
          { label: 'Asset Type', value: 'Server' },
          { label: 'Name', value: 'web-01' },
          { label: 'External Ref Id', value: 'EXT-99' },
        ],
      });
    });

    const info = workbook.getWorksheet('Info');
    if (!info) {
      throw new Error('Info sheet was not created');
    }
    expect(info.getCell('A1').value).toBe('Servers');
    expect(String(info.getCell('A2').value)).toContain('Generated');
    expect(info.getCell('A4').value).toBe('FILTER CRITERIA');
    expect(info.getCell('A5').value).toBe('Field');
    expect(info.getCell('B5').value).toBe('Value');
    expect(info.getCell('A6').value).toBe('Asset Type');
    expect(info.getCell('B6').value).toBe('Server');
    expect(info.getCell('A1').alignment?.horizontal).toBe('center');
    expect(info.getCell('B6').alignment?.horizontal).toBe('center');
    expect(info.getCell('A6').alignment?.horizontal).toBe('center');
    expect(info.getColumn(1).width).toBeGreaterThanOrEqual(28);
    expect(info.getColumn(2).width).toBeGreaterThanOrEqual(42);
  });

  it('center-justifies all data-sheet cells and keeps key columns wide', async () => {
    const workbook = await writeWorkbookToBuffer(async (writer) => {
      const state = (service as any).createExcelReportSheetState(
        (service as any).createExcelReportDataSheet(writer, 'V1'),
      );
      (service as any).writeExcelReportRows(state, [
        {
          name: 'web-01.example.internal',
          externalRefId: 'EXT-123456789',
          location_address: 'Tehran, District 1, Street 123',
          model: 'Dell PowerEdge R740',
          version: 2,
        },
      ]);
      (service as any).finalizeExcelReportDataSheet(state);
      state.worksheet.commit();
    });

    const sheet = workbook.getWorksheet('V1');
    if (!sheet) {
      throw new Error('V1 sheet was not created');
    }
    expect(sheet.getCell('A1').value).toBe('Name');
    expect(sheet.getCell('B1').value).toBe('External Ref Id');
    expect(sheet.getCell('C1').value).toBe('Location Address');
    expect(sheet.getCell('D1').value).toBe('Model');

    sheet.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        expect(cell.alignment?.horizontal).toBe('center');
        expect(cell.alignment?.vertical).toBe('middle');
      });
    });

    expect(sheet.getColumn(1).width).toBeGreaterThanOrEqual(36);
    expect(sheet.getColumn(2).width).toBeGreaterThanOrEqual(32);
    expect(sheet.getColumn(3).width).toBeGreaterThanOrEqual(50);
    expect(sheet.getColumn(4).width).toBeGreaterThanOrEqual(28);
  });

  it('writes Info and data sheets into the same workbook', async () => {
    const workbook = await writeWorkbookToBuffer(async (writer) => {
      await (service as any).writeExcelReportInfoSheet(writer, {
        title: 'Server',
        rows: [
          { label: 'Asset Type', value: 'Server' },
          { label: 'Name', value: 'web-01' },
          { label: 'External Ref Id', value: 'EXT-123456789' },
          { label: 'Location Type', value: 'Datacenter' },
          { label: 'Location', value: 'Tehran DC1' },
        ],
      });
      const state = (service as any).createExcelReportSheetState(
        (service as any).createExcelReportDataSheet(writer, 'V1'),
      );
      (service as any).writeExcelReportRows(state, [
        {
          name: 'web-01.example.internal',
          externalRefId: 'EXT-123456789',
          location_address: 'Tehran, District 1, No. 24, Datacenter Alley',
          model: 'Dell PowerEdge R740',
          version: 2,
          location: 'Tehran DC1',
        },
        {
          name: 'db-02.example.internal',
          externalRefId: 'EXT-987654321',
          location_address: 'Isfahan, Site B, Hall 3',
          model: 'HP ProLiant DL380',
          version: 1,
          location: 'Isfahan Site B',
        },
      ]);
      (service as any).finalizeExcelReportDataSheet(state);
      state.worksheet.commit();
    });

    expect(workbook.getWorksheet('Info')?.getCell('A1').value).toBe('Server');
    expect(workbook.getWorksheet('V1')?.getCell('A1').value).toBe('Name');
    expect(
      workbook.getWorksheet('V1')?.getCell('A2').alignment?.horizontal,
    ).toBe('center');
    expect(workbook.getWorksheet('Info')?.getCell('A6').font?.color?.argb).toBe(
      'FF111827',
    );
    expect(workbook.getWorksheet('V1')?.getCell('A2').font?.color?.argb).toBe(
      'FF111827',
    );
  });
});
