import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import axios from 'axios';
import * as ExcelJS from 'exceljs';
import { Request } from 'express';
import * as fs from 'fs';
import { I18nService } from 'nestjs-i18n';
import { basename, extname, join } from 'path';
import { stringify } from 'querystring';
import { AssetTypeVersionRepository } from 'src/asset-type/repositories/asset-type-version.repository';
import { AssetTypeRepository } from 'src/asset-type/repositories/asset-type.repository';
import { AssetTypeService } from 'src/asset-type/services/asset-type.service';
import { CreatedAssetFromFileResponseDto } from 'src/asset/dto/response/created-from-file-response.dto';
import { Asset } from 'src/asset/entities/asset.entity';
import { AssetRepository } from 'src/asset/repositories/asset.repository';
import { AssetService } from 'src/asset/services/asset.service';
import { FileTemplateTypeEnum } from 'src/common/enums/file-template-type.enum';
import { NetworkAdaptorConnectionType } from 'src/common/enums/network-adaptor-connection-type.enum';
import { NetworkAdaptorUsageEdgeEnum } from 'src/common/enums/network-adaptor-usage-edge.enum';
import { comparePersianStrings } from 'src/common/helpers/compare-persian-string';
import { UserGroups } from 'src/common/helpers/user-groups';
import { allowedMimeTypes } from 'src/common/multer-configs/allowed-type';
import {
  defineJoiSchema,
  validateObjectArray,
} from 'src/common/validations/excel-validation';
import { clientTemplates } from 'src/common/validations/excel-validation-template/client-excel-template';
import { serverTemplates } from 'src/common/validations/excel-validation-template/server-excel-template';
import { socTemplates } from 'src/common/validations/excel-validation-template/soc-excel-template';
import { vmTemplates } from 'src/common/validations/excel-validation-template/vm-excel-template';
import { UploadFileDto } from 'src/file/dto/input/upload-file.dto';
import { Location } from 'src/location/entities/location.entity';
import { LocationRepository } from 'src/location/repositories/location.repository';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { Vault } from 'src/vault/vault';
import { ApplyFileQueryDto } from './dto/input/apply-file.dto';
import { UploadFileResponseDto } from './dto/response/upload-file-response.dto';
import { FileRepository } from './repositories/file.repository';

@Injectable()
export class FileService {
  constructor(
    private readonly assetTypeRepository: AssetTypeRepository,
    private readonly assetTypeService: AssetTypeService,
    private readonly locationRepository: LocationRepository,
    private readonly assetTypeVersionRepository: AssetTypeVersionRepository,
    private readonly assetRepository: AssetRepository,
    private readonly assetService: AssetService,
    private readonly fileRepository: FileRepository,
    private readonly i18nService: I18nService,
  ) {}
  //------------------------------
  async validateAndProcessFile(
    file: Express.Multer.File,
    data: UploadFileDto,
  ): Promise<UploadFileResponseDto> {
    const { fileTemplateType } = data;

    if (!file || !file.buffer) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NO_FILE_PROVIDED'),
      );
    }

    const fileExtension = extname(file.originalname).toLowerCase();
    const expectedMimeType = allowedMimeTypes[fileExtension];

    if (!expectedMimeType || file.mimetype !== expectedMimeType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_UNSUPPORTED_FILE_EXTENSION'),
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.worksheets[0];

    const tempFolder = `./temp`;
    const tempFilePath = join(
      tempFolder,
      'file',
      `${new Date().getTime()}-${file.originalname}`,
    );

    const tempErrorFolder = join(tempFolder, 'error');
    const tempErrorFilePath = join(
      tempErrorFolder,
      `errors-${new Date().getTime()}-${file.originalname}.txt`,
    );

    const tempOriginalFilePath = join(
      tempErrorFolder,
      `original-${new Date().getTime()}-${file.originalname}`,
    );

    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true });
    }

    const template = data.fileTemplateType;
    if (!template) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_INVALID_DATA', {
          args: { value: 'template name' },
        }),
      );
    }

    let validationTemplate: any;
    if (fileTemplateType === FileTemplateTypeEnum.VM_TEMPLATE) {
      validationTemplate = vmTemplates;
    } else if (fileTemplateType === FileTemplateTypeEnum.SERVER_TEMPLATE) {
      validationTemplate = serverTemplates;
    } else if (fileTemplateType === FileTemplateTypeEnum.SOC_TEMPLATE) {
      validationTemplate = socTemplates;
    } else if (fileTemplateType === FileTemplateTypeEnum.CLIENT_TEMPLATE) {
      validationTemplate = clientTemplates;
    }

    const validationErrors: string[] = [];
    const validationSchema = defineJoiSchema(validationTemplate);

    const headerRow = worksheet.getRow(1);
    const fileHeaders = Array.isArray(headerRow.values)
      ? headerRow.values
          .slice(1)
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
      : [];

    const expectedHeaders: string[] = validationTemplate.map(
      (field: any) => field.name,
    );

    if (
      fileHeaders.length !== expectedHeaders.length ||
      !fileHeaders.every(
        (header: string, index: number) => header === expectedHeaders[index],
      )
    ) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_INVALID_DATA', {
          args: {
            value: `column headers. Expected columns: ${expectedHeaders.join(', ')}`,
          },
        }),
      );
    }

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;

      const rowValues = Array.isArray(row.values)
        ? row.values.slice(1)
        : Object.values(row.values || {});

      const rowObject = fileHeaders.reduce(
        (obj, header, index) => {
          obj[header] = rowValues[index];
          return obj;
        },
        {} as Record<string, any>,
      );

      const isValid = validateObjectArray(rowIndex, validationSchema, [
        rowObject,
      ]);

      if (isValid.errors) {
        isValid.errors.forEach((item) => validationErrors.push(item));
      }
    });

    if (validationErrors.length === 0) {
      const tempFileFolder = join(tempFolder, 'file');
      if (!fs.existsSync(tempFileFolder)) {
        fs.mkdirSync(tempFileFolder, { recursive: true });
      }

      const [tempFile, savedFile] = await Promise.all([
        fs.promises.writeFile(tempFilePath, file.buffer),
        this.fileRepository.save({ filePath: tempFilePath }),
      ]);

      return {
        referenceId: savedFile.id,
        message: 'File successfully validated',
        errors: false,
      };
    } else {
      if (!fs.existsSync(tempErrorFolder)) {
        fs.mkdirSync(tempErrorFolder, { recursive: true });
      }

      const [savedErrorFile, savedOriginalFile, savedFile] = await Promise.all([
        fs.promises.writeFile(tempErrorFilePath, validationErrors.join('\n')),
        fs.promises.writeFile(tempOriginalFilePath, file.buffer),
        this.fileRepository.save({ errorFilePath: tempErrorFilePath }),
      ]);

      return {
        referenceId: savedFile.id,
        message: 'Validation errors found!',
        errors: true,
      };
    }
  }

  //------------------------------
  async processFile(
    user: User,
    userRoles: Role[],
    request: Request,
    referenceId: string,
    query: ApplyFileQueryDto,
  ): Promise<any> {
    const authorization = request.headers.authorization;

    const existingFile = await this.fileRepository.findOne({
      where: { id: referenceId },
    });

    if (!existingFile) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: {
            property: 'File',
          },
        }),
      );
    }

    if (!existingFile.filePath) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_FILE_PATH_NOT_FOUND', {
          args: {
            property: 'File',
          },
        }),
      );
    }

    const dataList = await this.readFile(existingFile.filePath);
    const chunkSize = 100;

    let result: any;
    if (query.template === FileTemplateTypeEnum.SOC_TEMPLATE) {
      result = await this.processSocFile(
        user,
        userRoles,
        dataList,
        chunkSize,
        referenceId,
        request,
      );
    } else if (query.template === FileTemplateTypeEnum.SERVER_TEMPLATE) {
      result = await this.processServerFile(
        user,
        userRoles,
        dataList,
        chunkSize,
        referenceId,
        request,
      );
    } else if (query.template === FileTemplateTypeEnum.VM_TEMPLATE) {
      result = await this.processVMFile(
        user,
        userRoles,
        dataList,
        chunkSize,
        referenceId,
        request,
      );
    } else if (query.template === FileTemplateTypeEnum.CLIENT_TEMPLATE) {
      result = await this.processClientFile(
        user,
        userRoles,
        dataList,
        chunkSize,
        referenceId,
        request,
      );
    }

    return result;
  }

  //------------------------------
  async processVMFile(
    user: User,
    userRoles: Role[],
    dataList: any,
    chunkSize: number,
    referenceId: string,
    request: Request,
  ) {
    const [existingClusterType, existingOSType, existingVMType] =
      await Promise.all([
        this.assetTypeService.findOneByName('Cluster'),
        this.assetTypeService.findOneByName('Operating System'),
        this.assetTypeService.findOneByName('VM'),
      ]);

    let errors: any[] = [];
    const savedVMIds: string[] = [];

    const processChunk = async (chunk: any[], startIndex: number) => {
      outerLoop: for (const [index, item] of chunk.entries()) {
        let shouldContinueLoop = false;
        const originalIndex = startIndex + index;

        const ipArray: string[] = [];

        item['IP'].split(';').forEach((ip: string) => {
          const trimmedIp = ip.trim();
          if (trimmedIp) {
            ipArray.push(trimmedIp);
          }
        });

        const externalRefId = `${item['NAME*']}@${ipArray[0]}`;
        const existingVM = await this.assetRepository.findOne({
          where: { externalRefId },
        });

        if (existingVM) {
          errors.push({
            step: 'Asset Creation',
            message: `Row ${originalIndex + 1} - Warning : Virtual machine with external reference Id : ${existingVM.externalRefId} is already exists`,
          });
          continue outerLoop;
        }

        const relatedAssetForVM: string[] = [];
        const inquiryAccountableData = await this.getUserInfoByUsername(
          request,
          item['ACCOUNTABLE*'],
          originalIndex,
        );

        if (inquiryAccountableData.error) {
          if (this.isErrorResponse(inquiryAccountableData)) {
            inquiryAccountableData.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(inquiryAccountableData.errors);
            shouldContinueLoop = true;
          }
        }

        const inquiryEditorData = await this.getUserInfoByUsername(
          request,
          item['RESPONSIBLE*'],
          originalIndex,
        );

        if (inquiryEditorData.error) {
          if (this.isErrorResponse(inquiryEditorData)) {
            inquiryEditorData.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(inquiryEditorData.errors);
            shouldContinueLoop = true;
          }
        }

        if (item['CLUSTER_NAME']) {
          const existingCluster =
            await this.assetRepository.findOneCaseInsensitive(
              'name',
              item['CLUSTER_NAME'],
              existingClusterType.id,
              true,
            );

          if (
            existingCluster &&
            existingCluster.assetVersions &&
            existingCluster.assetVersions[0]
          ) {
            relatedAssetForVM.push(existingCluster.assetVersions[0].id);
          } else {
            errors = errors.concat(
              `Row ${originalIndex + 1} - Error : Related Asset Not Found Cluster ${item['CLUSTER_NAME']}`,
            );
            shouldContinueLoop = true;
          }
        }

        if (item['OS_TYPE'] && item['OS_VERSION']) {
          const existingOS = await this.assetRepository.findOneCaseInsensitive(
            'externalRefId',
            `${item['OS_TYPE']} ${item['OS_VERSION']}`,
            existingOSType.id,
            true,
          );

          if (
            existingOS &&
            existingOS.assetVersions &&
            existingOS.assetVersions[0]
          ) {
            relatedAssetForVM.push(existingOS.assetVersions[0].id);
          } else {
            errors = errors.concat(
              `Row ${originalIndex + 1} - Error : Related Asset Not Found OS With ExternalRefId ${`${item['OS_TYPE']} ${item['OS_VERSION']}`}`,
            );

            shouldContinueLoop = true;
          }
        }

        if (
          !inquiryAccountableData.data.IdpUserId ||
          !inquiryEditorData.data.IdpUserId
        ) {
          errors.push({
            step: 'User Inquiry',
            message: `Row ${originalIndex + 1} - Error : error in getting user data`,
          });
          shouldContinueLoop = true;
        }

        let existingLocation: Location | null = null;
        if (item['VIRTUAL_LOCATION*']) {
          existingLocation =
            await this.locationRepository.findOneCaseInsensitive(
              'exCode',
              item['VIRTUAL_LOCATION*'],
            );

          if (!existingLocation) {
            errors = errors.concat(
              `Row ${originalIndex + 1} - Error : Location Not Found ${item['VIRTUAL_LOCATION*']}`,
            );
            shouldContinueLoop = true;
          }
        }

        if (shouldContinueLoop) {
          continue outerLoop;
        }

        let createdVM: CreatedAssetFromFileResponseDto;

        if (!existingVM && existingVMType) {
          const vmBody = {
            assetTypeVersionId: existingVMType.latestVersion.id,
            name: item['NAME*'],
            externalRefId,
            accountableId: inquiryAccountableData.data.IdpUserId!,
            accountableUnitId: inquiryAccountableData.data.UnitId!,
            editorId: inquiryEditorData.data.IdpUserId!,
            editorUnitId: inquiryEditorData.data.UnitId!,
            content: {
              Services: [
                {
                  ServiceName: item['SERVICE_NAME'],
                  Status: 'Active',
                  StartupSetting: 'Automatic',
                },
              ],
              Network: {
                IP: ipArray,
              },
              CPU: {
                Cores: Number(item['CPU_CORES*']),
              },
              RAM: {
                AllocatedGB: String(item['RAM(GB)*']),
              },
              Storage: {
                AllocatedGB: String(item['STORAGE(GB)*']),
              },
              State: {
                currentState: 'Running',
              },
            },
            relatedAssetIds: relatedAssetForVM,
            locationId: existingLocation?.id,
          };

          createdVM = await this.assetService.createFromFile(
            user,
            userRoles,
            vmBody,
          );

          if (this.isErrorResponse(createdVM)) {
            createdVM.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(createdVM.errors);
            continue;
          }

          if (this.hasAsset(createdVM)) {
            savedVMIds.push(createdVM.asset.id);
          }
        }
      }
    };

    for (let i = 0; i < dataList.length; i += chunkSize) {
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(dataList.length / chunkSize);

      const chunk = dataList.slice(i, i + chunkSize);
      console.log(
        `Processing chunk ${chunkIndex} of ${totalChunks} (${chunk.length} rows)`,
      );
      await processChunk(chunk, i);
    }

    if (errors.length > 0) {
      const tempErrorFolder = join('./temp', 'error');
      const tempErrorFilePath = join(
        tempErrorFolder,
        `errors-${referenceId}-${new Date().getTime()}.txt`,
      );

      if (!fs.existsSync(tempErrorFolder)) {
        fs.mkdirSync(tempErrorFolder, { recursive: true });
      }

      await fs.promises.writeFile(
        tempErrorFilePath,
        errors.map((error) => JSON.stringify(error)).join('\n'),
      );

      const savedErrorFile = await this.fileRepository.save({
        errorFilePath: tempErrorFilePath,
      });

      return {
        message: 'Validation errors found!',
        errors: true,
        referenceId: savedErrorFile.id,
        savedVMIds,
      };
    }

    return {
      message: 'File processed successfully',
      errors: false,
      savedVMIds,
    };
  }

  //------------------------------
  async processClientFile(
    user: User,
    userRoles: Role[],
    dataList: any,
    chunkSize: number,
    referenceId: string,
    request: Request,
  ) {
    const [existingClientType, existingOSType] = await Promise.all([
      this.assetTypeService.findOneByName('Client'),
      this.assetTypeService.findOneByName('Operating System'),
    ]);

    let errors: any[] = [];
    const savedClientIds: string[] = [];

    const processChunk = async (chunk: any[], startIndex: number) => {
      outerLoop: for (const [index, item] of chunk.entries()) {
        let shouldContinueLoop = false;
        const originalIndex = startIndex + index;

        const ipArray: string[] = [];
        const macArray: string[] = [];

        item['NETWORK_IP*'].split(';').forEach((ip: string) => {
          const trimmedIp = ip.trim();
          if (trimmedIp) {
            ipArray.push(trimmedIp);
          }
        });

        item['NETWORK_MAC*'].split(';').forEach((mac: string) => {
          const trimmedMac = mac.trim();
          if (trimmedMac) {
            macArray.push(trimmedMac);
          }
        });

        const externalRefId = `${item['DEVICE_NAME*']}@${ipArray[0]}`;
        const existingClient = await this.assetRepository.findOne({
          where: { externalRefId },
        });

        if (existingClient) {
          errors.push({
            step: 'Asset Creation',
            message: `Row ${originalIndex + 1} - Warning : Client with external reference Id : ${existingClient.externalRefId} is already exists`,
          });
          continue outerLoop;
        }

        const relatedAssetForClient: string[] = [];
        const inquiryAccountableData = await this.getUserInfoByUsername(
          request,
          item['ACCOUNTABLE_USER*'],
          originalIndex,
        );

        if (inquiryAccountableData.error) {
          if (this.isErrorResponse(inquiryAccountableData)) {
            inquiryAccountableData.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(inquiryAccountableData.errors);
            shouldContinueLoop = true;
          }
        }

        const inquiryEditorData = await this.getUserInfoByUsername(
          request,
          item['RESPONSIBLE_USER*'],
          originalIndex,
        );

        if (inquiryEditorData.error) {
          if (this.isErrorResponse(inquiryEditorData)) {
            inquiryEditorData.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(inquiryEditorData.errors);
            shouldContinueLoop = true;
          }
        }

        if (item['OS_TYPE'] && item['OS_VERSION']) {
          const existingOS = await this.assetRepository.findOneCaseInsensitive(
            'externalRefId',
            `${item['OS_TYPE']} ${String(item['OS_VERSION'])}`,
            existingOSType.id,
            true,
          );

          if (
            existingOS &&
            existingOS.assetVersions &&
            existingOS.assetVersions[0]
          ) {
            relatedAssetForClient.push(existingOS.assetVersions[0].id);
          } else {
            errors = errors.concat(
              `Row ${originalIndex + 1} - Error : Related Asset Not Found OS With ExternalRefId ${`${item['OS_TYPE']} ${item['OS_VERSION']}`}`,
            );

            shouldContinueLoop = true;
          }
        }

        if (
          !inquiryAccountableData.data.IdpUserId ||
          !inquiryEditorData.data.IdpUserId
        ) {
          errors.push({
            step: 'User Inquiry',
            message: `Row ${originalIndex + 1} - Error : error in getting user data`,
          });
          shouldContinueLoop = true;
        }

        let existingLocation: Location | null = null;
        if (item['LOCATION*']) {
          existingLocation =
            await this.locationRepository.findOneCaseInsensitive(
              'exCode',
              item['LOCATION*'],
            );

          if (!existingLocation) {
            errors = errors.concat(
              `Row ${originalIndex + 1} - Error : Location Not Found ${item['LOCATION*']}`,
            );
            shouldContinueLoop = true;
          }
        }

        if (shouldContinueLoop) {
          continue outerLoop;
        }

        let createdClient: CreatedAssetFromFileResponseDto;

        if (!existingClient && existingClientType) {
          const isAdmin: boolean = false;

          const clientBody = {
            assetTypeVersionId: existingClientType.latestVersion.id,
            name: item['DEVICE_NAME*'],
            externalRefId,
            accountableId: inquiryAccountableData.data.IdpUserId!,
            accountableUnitId: inquiryAccountableData.data.UnitId!,
            editorId: inquiryEditorData.data.IdpUserId!,
            editorUnitId: inquiryEditorData.data.UnitId!,
            content: {
              DeviceType: item['DEVICE_TYPE*'],
              DeviceName: item['DEVICE_NAME*'],
              MacAddress: macArray,
              IPAddress: ipArray,
              ConnectionStatus: 'Connected',
              Username: item['USER_NAME*'],
              PhysicalLocation: item['LOCATION*'],
              NetworkDomain: item['NETWORK_DOMAIN*'],
              UserIsAdmin: item['USER_IS_ADMIN*'] == 'Y' ? !isAdmin : isAdmin,
              Hardware: {
                CPU: item['DEVICE_CPU_MODEL'],
                RAM: item['DEVICE_RAM(GB)'],
                Storage: item['DEVICE_STORAGE(GB)'],
                // GPU: item['DEVICE_CPU_FREQ(GHz)'],
              },
              DeviceStatus: item['STATE'],
              HealthStatus: 'Normal',
            },
            relatedAssetIds: relatedAssetForClient,
            locationId: existingLocation?.id,
          };

          createdClient = await this.assetService.createFromFile(
            user,
            userRoles,
            clientBody,
          );

          if (this.isErrorResponse(createdClient)) {
            createdClient.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(createdClient.errors);
            continue;
          }

          if (this.hasAsset(createdClient)) {
            savedClientIds.push(createdClient.asset.id);
          }
        }
      }
    };

    for (let i = 0; i < dataList.length; i += chunkSize) {
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(dataList.length / chunkSize);

      const chunk = dataList.slice(i, i + chunkSize);
      console.log(
        `Processing chunk ${chunkIndex} of ${totalChunks} (${chunk.length} rows)`,
      );
      await processChunk(chunk, i);
    }

    if (errors.length > 0) {
      const tempErrorFolder = join('./temp', 'error');
      const tempErrorFilePath = join(
        tempErrorFolder,
        `errors-${referenceId}-${new Date().getTime()}.txt`,
      );

      if (!fs.existsSync(tempErrorFolder)) {
        fs.mkdirSync(tempErrorFolder, { recursive: true });
      }

      await fs.promises.writeFile(
        tempErrorFilePath,
        errors.map((error) => JSON.stringify(error)).join('\n'),
      );

      const savedErrorFile = await this.fileRepository.save({
        errorFilePath: tempErrorFilePath,
      });

      return {
        message: 'Validation errors found!',
        errors: true,
        referenceId: savedErrorFile.id,
        savedClientIds,
      };
    }

    return {
      message: 'File processed successfully',
      errors: false,
      savedClientIds,
    };
  }

  //------------------------------
  async processSocFile(
    user: User,
    userRoles: Role[],
    dataList: any,
    chunkSize: number,
    referenceId: string,
    request: Request,
  ) {
    const [networkAdaptorType, logSourceType] = await Promise.all([
      this.assetTypeService.findOneByName('Network Adapter'),
      this.assetTypeService.findOneByName('Log Source'),
    ]);

    if (!networkAdaptorType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: {
            property: 'Network Adaptor asset-type',
          },
        }),
      );
    }

    if (!logSourceType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: {
            property: 'Log Source asset-type',
          },
        }),
      );
    }

    let errors: any[] = [];
    const savedNetworkAdaptorIds: string[] = [];
    const savedLogSourceIds: string[] = [];

    const processChunk = async (chunk: any[], startIndex: number) => {
      outerLoop: for (const [index, item] of chunk.entries()) {
        let shouldContinueLoop = false;
        const originalIndex = startIndex + index;

        const relatedAssetForLogSource: string[] = [];
        const accountableKey =
          Object.keys(UserGroups).find((elm) =>
            comparePersianStrings(elm, item['User Group']),
          ) ?? '';

        const editorKey =
          Object.keys(UserGroups).find((elm) =>
            comparePersianStrings(elm, item['Owner Group']),
          ) ?? '';

        const editor = UserGroups[editorKey];
        const accountable = UserGroups[accountableKey];

        const inquiryData = await this.groupsInquiry(
          request,
          originalIndex,
          editor,
          accountable,
        );

        if (inquiryData.error) {
          if (this.isErrorResponse(inquiryData)) {
            inquiryData.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(inquiryData.errors);
            shouldContinueLoop = true;
          }
        }

        const editorGroupId = inquiryData.data.editorGroup.departmentId;
        const accountableGroupId =
          inquiryData.data.accountableGroup.departmentId;

        const editorManagerId = await this.getGroupManagerId(
          request,
          editorGroupId,
          originalIndex.toString(),
        );
        const accountableManagerId = await this.getGroupManagerId(
          request,
          accountableGroupId,
          originalIndex.toString(),
        );

        const naExternalRefId = `${item['Host Name']}@${item['IP']}@${item['Logsource ID']}`;
        const existingNetworkAdaptor = await this.assetRepository.findOne({
          where: {
            externalRefId: naExternalRefId,
            assetTypeId: networkAdaptorType.id,
          },
          relations: {
            assetVersions: true,
          },
          order: { assetVersions: { createdAt: 'DESC' } },
        });

        if (
          existingNetworkAdaptor &&
          existingNetworkAdaptor.assetVersions &&
          existingNetworkAdaptor.assetVersions[0]
        ) {
          relatedAssetForLogSource.push(
            existingNetworkAdaptor.assetVersions[0].id,
          );
          errors.push({
            step: 'Asset Creation',
            message: `Row ${originalIndex + 1} - Warning : Network adaptor with external reference Id : ${existingNetworkAdaptor.externalRefId} is already exists`,
          });
          continue outerLoop;
        }

        let createdNetworkAdaptor: CreatedAssetFromFileResponseDto;
        let useAgeEdge: string;
        let internetConnected: boolean = false;

        if (!existingNetworkAdaptor && networkAdaptorType) {
          if (
            item['Internet Connected'] != null &&
            item['Internet Connected'] != ''
          ) {
            useAgeEdge =
              item['Network-Connection'] === 'o-edge'
                ? NetworkAdaptorUsageEdgeEnum.OperationEdge
                : NetworkAdaptorUsageEdgeEnum.BranchEdge;
            internetConnected = true;
          } else {
            useAgeEdge = '';
          }

          const networkAdaptorBody = {
            assetTypeVersionId: networkAdaptorType.id,
            name: item['Host Name'],
            externalRefId: naExternalRefId,
            accountableId: accountableManagerId.data.managerId,
            accountableUnitId: accountableGroupId,
            editorId: editorManagerId.data.managerId,
            editorUnitId: editorGroupId,
            content: {
              DeviceName: item['Host Name'],
              AdaptorType: 'Physical',
              ConnectionType: NetworkAdaptorConnectionType.ETHERNET,
              ConnectionStatus: 'Connected',
              InternetConnected: internetConnected,
              UsageEdge: useAgeEdge,
              IpAddress: [
                {
                  Address: item['IP'],
                  IPVersion: 'IPv4',
                  Enabled: true,
                  HostName: item['Host Name'],
                },
              ],
            },
            relatedAssets: [],
            // TODO : Add location
          };

          createdNetworkAdaptor = await this.assetService.createFromFile(
            user,
            userRoles,
            networkAdaptorBody,
          );

          if (this.isErrorResponse(createdNetworkAdaptor)) {
            createdNetworkAdaptor.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(createdNetworkAdaptor.errors);
            shouldContinueLoop = true;
          }

          if (this.hasAsset(createdNetworkAdaptor)) {
            relatedAssetForLogSource.push(createdNetworkAdaptor.asset.id);
            savedNetworkAdaptorIds.push(createdNetworkAdaptor.asset.id);
          }
        }

        const lsExternalRefId = `${item['Logsource ID']}`;
        const existingLogSource = await this.assetRepository.findOne({
          where: {
            externalRefId: lsExternalRefId,
            assetTypeId: logSourceType.id,
          },
          relations: {
            assetVersions: true,
          },
          order: { assetVersions: { createdAt: 'DESC' } },
        });

        if (
          existingLogSource &&
          existingLogSource.assetVersions &&
          existingLogSource.assetVersions[0]
        ) {
          errors.push({
            step: 'Asset Creation',
            message: `Row ${originalIndex + 1} - Warning : Log source with external reference Id : ${existingLogSource.externalRefId} is already exists`,
          });
          continue;
        }

        let createdLogSource: CreatedAssetFromFileResponseDto;
        let enabled: boolean = true;

        if (!existingLogSource && logSourceType) {
          if (
            item['Logsource Name']
              .split(' ')
              .findIndex((word: string) => word === 'deleted') > -1
          ) {
            enabled = false;
          }

          const logSourceBody = {
            assetTypeVersionId: logSourceType.id,
            name: item['Logsource Name'],
            externalRefId: lsExternalRefId,
            accountableId: accountableManagerId.data.managerId,
            accountableUnitId: accountableGroupId,
            editorId: editorManagerId.data.managerId,
            editorUnitId: editorGroupId,
            content: {
              SourceName: item['Logsource Name'],
              SourceType: item['Log Source Type'],
              Host: item['Host Name'],
              Enabled: enabled,
            },
            relatedAssetIds: relatedAssetForLogSource,
          };

          createdLogSource = await this.assetService.createFromFile(
            user,
            userRoles,
            logSourceBody,
          );

          if (this.isErrorResponse(createdLogSource)) {
            createdLogSource.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(createdLogSource.errors);
            continue;
          }

          if (this.hasAsset(createdLogSource)) {
            savedLogSourceIds.push(createdLogSource.asset.id);
          }
        }
      }
    };

    for (let i = 0; i < dataList.length; i += chunkSize) {
      const chunk = dataList.slice(i, i + chunkSize);
      await processChunk(chunk, i);
    }

    if (errors.length > 0) {
      const tempErrorFolder = join('./temp', 'error');
      const tempErrorFilePath = join(
        tempErrorFolder,
        `errors-${referenceId}-${new Date().getTime()}.txt`,
      );

      if (!fs.existsSync(tempErrorFolder)) {
        fs.mkdirSync(tempErrorFolder, { recursive: true });
      }

      await fs.promises.writeFile(
        tempErrorFilePath,
        errors.map((error) => JSON.stringify(error)).join('\n'),
      );

      const savedErrorFile = await this.fileRepository.save({
        errorFilePath: tempErrorFilePath,
      });

      return {
        message: 'Validation errors found!',
        errors: true,
        referenceId: savedErrorFile.id,
        savedNetworkAdaptorIds,
        savedLogSourceIds,
      };
    }

    return {
      message: 'File processed successfully',
      errors: false,
      savedNetworkAdaptorIds,
      savedLogSourceIds,
    };
  }

  //------------------------------
  async processServerFile(
    user: User,
    userRoles: Role[],
    dataList: any,
    chunkSize: number,
    referenceId: string,
    request: Request,
  ) {
    const [
      existingServerType,
      existingClusterType,
      existingOSType,
      existingHypervisorType,
      existingStorageType,
    ] = await Promise.all([
      this.assetTypeService.findOneByName('Server'),
      this.assetTypeService.findOneByName('Cluster'),
      this.assetTypeService.findOneByName('Operating System'),
      this.assetTypeService.findOneByName('Hypervisor'),
      this.assetTypeService.findOneByName('Storage'),
    ]);

    let errors: any[] = [];
    const savedServerIds: string[] = [];

    const processChunk = async (chunk: any[], startIndex: number) => {
      outerLoop: for (const [index, item] of chunk.entries()) {
        let shouldContinueLoop = false;
        const originalIndex = startIndex + index;

        const ipArray = (item['IP'] ?? '')
          .split(';')
          .map((ip: string) => ip.trim())
          .filter(Boolean);
        const externalRefId = `${item['NAME*']}@${ipArray[0] || ''}`;

        const existingServer = await this.assetRepository.findOne({
          where: { externalRefId, assetTypeId: existingServerType.id },
        });

        if (existingServer) {
          errors.push({
            step: 'Duplicate Check',
            message: `Row ${originalIndex + 1} - Server ${externalRefId} already exists`,
          });
          continue outerLoop;
        }

        const relatedAssetForServer: string[] = [];
        const inquiryAccountableData = await this.getUserInfoByUsername(
          request,
          item['ACCOUNTABLE*'],
          originalIndex,
        );

        if (inquiryAccountableData.error) {
          if (this.isErrorResponse(inquiryAccountableData)) {
            inquiryAccountableData.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(inquiryAccountableData.errors);
            shouldContinueLoop = true;
          }
        }

        const inquiryEditorData = await this.getUserInfoByUsername(
          request,
          item['RESPONSIBLE*'],
          originalIndex,
        );

        if (inquiryEditorData.error) {
          if (this.isErrorResponse(inquiryEditorData)) {
            inquiryEditorData.errors.map((error) => {
              error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
            });

            errors = errors.concat(inquiryEditorData.errors);
            shouldContinueLoop = true;
          }
        }

        if (item['CLUSTER_NAME']) {
          const existingCluster =
            await this.assetRepository.findOneCaseInsensitive(
              'name',
              item['CLUSTER_NAME'],
              existingClusterType.id,
              true,
            );

          if (
            existingCluster &&
            existingCluster.assetVersions &&
            existingCluster.assetVersions[0]
          ) {
            relatedAssetForServer.push(existingCluster.assetVersions[0].id);
          } else {
            errors = errors.concat(
              `Row ${originalIndex + 1} - Error : Related Asset Not Found Cluster ${item['CLUSTER_NAME']}`,
            );
            shouldContinueLoop = true;
          }
        }

        const hasOSTypeAndVersion =
          Boolean(item['OS_TYPE']) && Boolean(item['OS_VERSION']);
        const hasHypervTypeAndVersion =
          Boolean(item['HYPERV_TYPE']) && Boolean(item['HYPERV_VERSION']);

        if (!hasOSTypeAndVersion && !hasHypervTypeAndVersion) {
          errors.push({
            step: 'Validation',
            message: `Row ${originalIndex + 1} - Either OS type/version or Hypervisor type/version must be provided`,
          });
          shouldContinueLoop = true;
        }

        if (item['OS_TYPE'] && item['OS_VERSION']) {
          const existingOS = await this.assetRepository.findOneCaseInsensitive(
            'externalRefId',
            `${item['OS_TYPE']} ${item['OS_VERSION']}`,
            existingOSType.id,
            true,
          );

          if (
            existingOS &&
            existingOS.assetVersions &&
            existingOS.assetVersions[0]
          ) {
            relatedAssetForServer.push(existingOS.assetVersions[0].id);
          } else {
            errors = errors.concat(
              `Row ${originalIndex + 1} - Error : Related Asset Not Found OS ${item['OS_TYPE']} ${item['OS_VERSION']}`,
            );
            shouldContinueLoop = true;
          }
        }

        if (item['HYPERV_TYPE'] && item['HYPERV_VERSION']) {
          const existingHypervisor =
            await this.assetRepository.findOneCaseInsensitive(
              'externalRefId',
              `${item['HYPERV_TYPE']} ${item['HYPERV_VERSION']}`,
              existingHypervisorType.id,
              true,
            );

          if (
            existingHypervisor &&
            existingHypervisor.assetVersions &&
            existingHypervisor.assetVersions[0]
          ) {
            relatedAssetForServer.push(existingHypervisor.assetVersions[0].id);
          } else {
            errors = errors.concat(
              `Row ${originalIndex + 1} - Error : Related Asset Not Found Hypervisor ${item['HYPERV_TYPE']} ${item['HYPERV_VERSION']}`,
            );
            shouldContinueLoop = true;
          }
        }

        const storageNames = (item['STORAGE_NAME'] ?? '')
          .split(';')
          .map((n: string) => n.trim());

        const storageIps = (item['STORAGE_IP'] ?? '')
          .split(';')
          .map((ip: string) => ip.trim());

        for (
          let i = 0;
          i < Math.min(storageNames.length, storageIps.length);
          i++
        ) {
          if (storageNames[i] && storageIps[i]) {
            const existingStorage =
              await this.assetRepository.findOneCaseInsensitive(
                'externalRefId',
                `${storageNames[i]}@${storageIps[i]}`,
                existingStorageType.id,
                true,
              );

            if (existingStorage?.assetVersions?.[0]?.id) {
              relatedAssetForServer.push(existingStorage.assetVersions[0].id);
            } else {
              errors = errors.concat(
                `Row ${originalIndex + 1} - Error : Related Asset Not Found Storage ${storageNames[i]}@${storageIps[i]}`,
              );
              shouldContinueLoop = true;
            }
          }
        }

        if (
          !inquiryAccountableData.data.IdpUserId ||
          !inquiryEditorData.data.IdpUserId
        ) {
          errors.push({
            step: 'User Inquiry',
            message: `Row ${originalIndex + 1} - Error : error in getting user data`,
          });
          shouldContinueLoop = true;
        }

        let existingLocation: Location | null = null;
        if (item['LOCATION*']) {
          existingLocation =
            await this.locationRepository.findOneCaseInsensitive(
              'exCode',
              item['LOCATION*'],
            );

          if (!existingLocation) {
            errors = errors.concat(
              `Row ${originalIndex + 1} - Error : Location Not Found ${item['LOCATION*']}`,
            );
            shouldContinueLoop = true;
          }
        }

        if (shouldContinueLoop) {
          continue outerLoop;
        }

        const serverBody = {
          assetTypeVersionId: existingServerType.latestVersion.id,
          name: item['NAME*'],
          externalRefId,
          accountableId: inquiryAccountableData.data.IdpUserId!,
          accountableUnitId: inquiryAccountableData.data.UnitId!,
          editorId: inquiryEditorData.data.IdpUserId!,
          editorUnitId: inquiryEditorData.data.UnitId!,
          content: {
            Model: item['MODEL'],
            ServerType: 'Physical',
            Network: { IP: ipArray },
            RAM: {
              AllocatedGB: String(item['RAM(GB)*']),
            },
            CPU: {
              Cores: Number(item['CPU_CORES*']),
              Frequency: item['CPU_FREQ(GHz)']
                ? String(item['CPU_FREQ(GHz)'])
                : undefined,
            },
          },
          relatedAssetIds: relatedAssetForServer,
          locationId: existingLocation?.id,
        };

        const createdServer = await this.assetService.createFromFile(
          user,
          userRoles,
          serverBody,
        );

        if (this.isErrorResponse(createdServer)) {
          createdServer.errors.map((error) => {
            error.message = `Row ${originalIndex + 1} - Error : ${error.message}`;
          });

          errors = errors.concat(createdServer.errors);
          continue;
        }

        if (this.hasAsset(createdServer)) {
          savedServerIds.push(createdServer.asset.id);
        }
      }
    };

    for (let i = 0; i < dataList.length; i += chunkSize) {
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(dataList.length / chunkSize);

      const chunk = dataList.slice(i, i + chunkSize);
      console.log(
        `Processing chunk ${chunkIndex} of ${totalChunks} (${chunk.length} rows)`,
      );
      await processChunk(chunk, i);
    }

    if (errors.length > 0) {
      const tempErrorFolder = join('./temp', 'error');
      const tempErrorFilePath = join(
        tempErrorFolder,
        `errors-${referenceId}-${new Date().getTime()}.txt`,
      );

      if (!fs.existsSync(tempErrorFolder)) {
        fs.mkdirSync(tempErrorFolder, { recursive: true });
      }

      await fs.promises.writeFile(
        tempErrorFilePath,
        errors.map((error) => JSON.stringify(error)).join('\n'),
      );

      const savedErrorFile = await this.fileRepository.save({
        errorFilePath: tempErrorFilePath,
      });

      return {
        message: 'Validation errors found!',
        errors: true,
        referenceId: savedErrorFile.id,
        savedServerIds,
      };
    }

    return {
      message: 'File processed successfully',
      errors: false,
      savedServerIds,
    };
  }

  //------------------------------
  async readFile(filePath: string): Promise<any> {
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: {
            property: 'File',
          },
        }),
      );
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const fileBuffer = await fs.promises.readFile(filePath);
      await workbook.xlsx.load(fileBuffer as any);

      const worksheet = workbook.worksheets[0];
      const data: any = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            headers[colNumber] = cell.text.trim();
          });
        } else {
          const rowData: { [key: string]: any } = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber]] =
              typeof cell.text === 'string' ? cell.text.trim() : cell.text;
          });
          data.push(rowData);
        }
      });

      return data;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error in reading file: ${error.message}`,
      );
    }
  }

  //------------------------------
  async download(referenceId: string) {
    const existingFile = await this.fileRepository.findOne({
      where: { id: referenceId },
    });

    if (!existingFile) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: {
            property: 'File',
          },
        }),
      );
    }

    const filePath = existingFile.filePath
      ? existingFile.filePath
      : existingFile.errorFilePath;

    if (filePath) {
      const fileExtension = extname(filePath).toLowerCase();

      let contentType: string;

      switch (fileExtension) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.pdf':
          contentType = 'application/pdf';
          break;
        default:
          contentType = 'application/octet-stream';
          break;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const originalFilename = basename(filePath);
      return {
        fileBuffer,
        originalFilename,
        contentType,
        filePath,
      };
    }
  }

  //------------------------------
  async getFileExcelTemplate(query: ApplyFileQueryDto) {
    const { template } = query;
    const templateMap: Record<FileTemplateTypeEnum, string> = {
      [FileTemplateTypeEnum.SOC_TEMPLATE]: 'soc',
      [FileTemplateTypeEnum.SERVER_TEMPLATE]: 'server',
      [FileTemplateTypeEnum.VM_TEMPLATE]: 'vm',
      [FileTemplateTypeEnum.CLIENT_TEMPLATE]: 'client',
    };

    const subFolder = templateMap[template as FileTemplateTypeEnum];
    if (!subFolder) {
      return `<h1>Requested file does not exists.</h1>`;
    }

    const p = join('files/excel/template', subFolder);
    const uploadPath = join(process.cwd(), p);

    let files: string[];
    try {
      files = fs.readdirSync(uploadPath);
    } catch {
      return `<h1>Requested file does not exists.</h1>`;
    }

    if (!files.length) {
      return `<h1>Requested file does not exists.</h1>`;
    }

    const file = fs.createReadStream(join(uploadPath, files[0]));
    return new StreamableFile(file, {
      disposition: `attachment; filename="${files[0]}"`,
    });
  }

  //------------------------------
  async saveFileExcelTemplate(file: Express.Multer.File, data: UploadFileDto) {
    const { fileTemplateType } = data;

    if (!file || !file.buffer) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NO_FILE_PROVIDED'),
      );
    }

    const templateMap: Record<FileTemplateTypeEnum, string> = {
      [FileTemplateTypeEnum.SOC_TEMPLATE]: 'soc',
      [FileTemplateTypeEnum.SERVER_TEMPLATE]: 'server',
      [FileTemplateTypeEnum.VM_TEMPLATE]: 'vm',
      [FileTemplateTypeEnum.CLIENT_TEMPLATE]: 'client',
    };

    const subFolder = templateMap[fileTemplateType as FileTemplateTypeEnum];
    if (!subFolder) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_INVALID_FILE_TEMPLATE_NAME'),
      );
    }

    const fileExtension = extname(file.originalname).toLowerCase();
    const expectedMimeType = allowedMimeTypes[fileExtension];

    if (!expectedMimeType || file.mimetype !== expectedMimeType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_UNSUPPORTED_FILE_EXTENSION'),
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.worksheets[0];

    let validationTemplate: any;
    if (fileTemplateType === FileTemplateTypeEnum.VM_TEMPLATE) {
      validationTemplate = vmTemplates;
    } else if (fileTemplateType === FileTemplateTypeEnum.SERVER_TEMPLATE) {
      validationTemplate = serverTemplates;
    } else if (fileTemplateType === FileTemplateTypeEnum.SOC_TEMPLATE) {
      validationTemplate = socTemplates;
    } else if (fileTemplateType === FileTemplateTypeEnum.CLIENT_TEMPLATE) {
      validationTemplate = clientTemplates;
    }

    const headerRow = worksheet.getRow(1);
    const fileHeaders = Array.isArray(headerRow.values)
      ? headerRow.values
          .slice(1)
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
      : [];

    const expectedHeaders: string[] = validationTemplate.map(
      (field: any) => field.name,
    );

    if (
      fileHeaders.length !== expectedHeaders.length ||
      !fileHeaders.every(
        (header: string, index: number) => header === expectedHeaders[index],
      )
    ) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_INVALID_DATA', {
          args: {
            value: `column headers. Expected columns: ${expectedHeaders.join(', ')}`,
          },
        }),
      );
    }

    const p = join('files/excel/template', subFolder);
    const uploadPath = join(process.cwd(), p);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const uniqueFilename = file.originalname;
    const filePath = join(uploadPath, uniqueFilename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    fs.writeFileSync(filePath, file.buffer);
    return { filePath: `${p}/${uniqueFilename}`, type: fileTemplateType };
  }

  //------------------------------
  async groupsInquiry(
    request: Request,
    index: number,
    editorGroupName: string,
    accountableGroupName: string,
  ) {
    const errors: any[] = [];
    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );

    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    let result;
    try {
      const q = stringify({
        departmentLevelName: 'گروه',
      });
      const { data } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/auth/chart?${q}`,
        {
          headers: {
            Cookie: request.headers.cookie,
            'Content-Type':
              request.headers['content-type'] || 'application/json',
          },
          withCredentials: true,
        },
      );

      result = data.data;
    } catch (error) {
      errors.push({
        step: 'Groups Inquiry',
        message: `Row ${index + 1} - Error: Failed to inquiry groups data from HRMS. Details: ${error.message}`,
      });
    }

    if (errors.length > 0) {
      return { error: true, errors, data: {} };
    }

    let editorGroup = result.find((group: any) =>
      comparePersianStrings(group.departmentName, editorGroupName),
    );

    let accountableGroup = result.find((group: any) =>
      comparePersianStrings(group.departmentName, accountableGroupName),
    );

    if (!editorGroup || !accountableGroup) {
      try {
        const q = stringify({
          departmentLevelName: 'مدیریت',
        });
        const { data } = await axios.get(
          `${IDP_SERVICE_URL}/idp/api/v1/auth/chart?${q}`,
          {
            headers: {
              Cookie: request.headers.cookie,
              'Content-Type':
                request.headers['content-type'] || 'application/json',
            },
            withCredentials: true,
          },
        );

        result = data.data;
      } catch (error) {
        errors.push({
          step: 'Groups Inquiry',
          message: `Row ${index + 1} - Error: Failed to inquiry groups data from HRMS. Details: ${error.message}`,
        });
      }

      editorGroup = result.find((group: any) => {
        comparePersianStrings(group.departmentName, editorGroupName);
      });

      accountableGroup = result.find((group: any) => {
        comparePersianStrings(group.departmentName, accountableGroupName);
      });
    }

    if (!editorGroup) {
      errors.push({
        step: 'Groups Inquiry',
        message: `Row ${index + 1} - Error: Editor group '${editorGroupName}' not found.`,
      });
    }

    if (!accountableGroup) {
      errors.push({
        step: 'Groups Inquiry',
        message: `Row ${index + 1} - Error: Accountable group '${accountableGroupName}' not found.`,
      });
    }

    return {
      error: errors.length > 0,
      errors,
      data: {
        editorGroup,
        accountableGroup,
      },
    };
  }

  //------------------------------
  async getGroupManagerId(request: Request, groupId: string, index: string) {
    const errors: any[] = [];

    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');
    let managerData;
    try {
      const q = stringify({
        GroupId: groupId,
      });
      const { data } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees?${q}`,
        {
          headers: {
            Cookie: request.headers.cookie,
            'Content-Type':
              request.headers['content-type'] || 'application/json',
          },
          withCredentials: true,
        },
      );
      managerData = data.data.length > 0 ? data.data[0] : [];
    } catch (error) {
      errors.push({
        step: 'User Inquiry',
        message: `Row ${index + 1} - Error: Failed to inquiry users data from HRMS. Details: ${error.message}`,
      });
    }

    if (errors.length > 0) {
      return { error: true, errors, data: {} };
    }

    if (managerData.length == 0 && !managerData.ManagerId) {
      errors.push({
        step: 'User Inquiry',
        message: `Row ${index + 1} - Error: Manager with groupId '${groupId}' not found.`,
      });
    }

    return {
      error: errors.length > 0,
      errors,
      data: {
        managerId: managerData.ManagerId,
      },
    };
  }

  //------------------------------
  async getUserInfoByUsername(
    request: Request,
    username: string,
    index: number,
  ): Promise<{
    error: boolean;
    errors: any[];
    data: {
      IdpUserId?: string;
      UnitId?: string;
    };
  }> {
    const errors: any[] = [];
    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );

    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');
    let userData;

    try {
      const params = new URLSearchParams({
        ADUserName: `iranet\\${username}`,
      });

      const { data } = await axios.get<{
        data: {
          EmployeeId: string;
          GroupId: string;
          GroupName: string | null;
          ManagementId: string;
          ManagementName: string | null;
          DepartmentId: string;
          DepartmentName: string | null;
        }[];
      }>(`${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees`, {
        params,
        headers: {
          Cookie: request.headers.cookie,
          'Content-Type': request.headers['content-type'] || 'application/json',
        },
        withCredentials: true,
      });
      userData = data.data[0];
    } catch (error) {
      errors.push({
        step: 'User Inquiry',
        message: `Row ${index + 1} - Error: Failed to inquiry users data from HRMS. Details: ${error.message}`,
      });
    }

    if (errors.length > 0) {
      return { error: true, errors, data: {} };
    }

    if (!userData) {
      errors.push({
        step: 'User Inquiry',
        message: `Row ${index + 1} - Error: User with username '${username}' not found.`,
      });
    }

    let unitId: string | undefined = undefined;
    if (userData?.GroupName) {
      unitId = userData?.GroupId;
    } else if (userData?.ManagementName) {
      unitId = userData?.ManagementId;
    } else if (userData?.DepartmentName) {
      unitId = userData?.DepartmentId;
    }
    return {
      error: errors.length > 0,
      errors,
      data: {
        IdpUserId: userData?.EmployeeId,
        UnitId: unitId,
      },
    };
  }

  //------------------------------
  private isErrorResponse(
    response: CreatedAssetFromFileResponseDto,
  ): response is { errors: any[] } {
    return 'errors' in response;
  }

  //------------------------------
  private hasAsset(
    response: CreatedAssetFromFileResponseDto,
  ): response is { asset: Asset } {
    return 'asset' in response && response.asset !== undefined;
  }
}
