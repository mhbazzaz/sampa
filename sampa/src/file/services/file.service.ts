import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import fromBuffer from 'magic-bytes.js';
import { I18nService } from 'nestjs-i18n';
import * as path from 'path';
import { join } from 'path';
import { allowedMimeTypes } from 'src/common/multer-config/allowed-type';
import { multerConfig } from 'src/common/multer-config/file-storage';
import { CreateFileDto } from '../dto/input/create-file.dto';
import { FileRepository } from '../repositories/file.repository';

@Injectable()
export class FileService {
  constructor(
    private readonly fileRepository: FileRepository,
    private i18nService: I18nService,
  ) {}

  //------------------------------
  async upload(data: CreateFileDto, file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException(
        this.i18nService.t('validation.IsNotEmpty', {
          args: { property: 'file' },
        }),
      );
    }

    const fileExtension = Object.keys(allowedMimeTypes).find((ext) =>
      file.originalname.endsWith(ext),
    );

    if (!fileExtension) {
      throw new BadRequestException(
        this.i18nService.t('validation.ERROR_UNSUPPORTED_FILE_EXTENSION'),
      );
    }

    const expectedMimeType = allowedMimeTypes[fileExtension];

    const detectedTypes = fromBuffer(file.buffer);
    const detectedType = detectedTypes[0] ? detectedTypes[0].mime : null;

    if (!detectedType || detectedType !== expectedMimeType) {
      throw new BadRequestException(
        this.i18nService.t('validation.ERROR_UNSUPPORTED_FILE_EXTENSION'),
      );
    }

    const uploadPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'files',
      multerConfig.dest,
    );

    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    const timestamp = new Date().getTime();
    const uniqueFilename = `${timestamp}-${file.originalname}`;
    const filePath = join(uploadPath, uniqueFilename);

    writeFileSync(filePath, file.buffer);
    const request = { name: data.name, path: filePath };

    return await this.fileRepository.save(request);
  }

  //------------------------------
  async download(referenceId: string) {
    const foundFile = await this.fileRepository.findOne({
      where: { id: referenceId },
    });

    if (!foundFile)
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'file' },
        }),
      );

    const filePath = foundFile.path;
    const fileExtension = path.extname(filePath).toLowerCase();

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

    const fileBuffer = readFileSync(filePath);
    const originalFilename = path.basename(filePath);

    return {
      fileBuffer,
      originalFilename,
      contentType,
      filePath,
    };
  }

  //------------------------------
  async handleImageUpload(image: Express.Multer.File) {
    if (!image?.buffer) {
      throw new BadRequestException(
        this.i18nService.t('validation.IsNotEmpty', {
          args: { property: 'file' },
        }),
      );
    }

    const fileExtension = path.extname(image.originalname).toLowerCase();
    const expectedMimeType = allowedMimeTypes[fileExtension];

    if (!expectedMimeType || image.mimetype !== expectedMimeType) {
      throw new BadRequestException(
        this.i18nService.t('validation.ERROR_UNSUPPORTED_FILE_EXTENSION'),
      );
    }

    const uploadDir = 'files/test-case/images';
    const uploadPath = path.join(process.cwd(), uploadDir);

    await fs.promises.mkdir(uploadPath, { recursive: true });

    const sanitizedFilename = `${Date.now()}-${image.originalname.replace(/[^a-zA-Z0-9-_.]/g, '')}`;
    const filePath = path.join(uploadPath, sanitizedFilename);

    await fs.promises.writeFile(filePath, image.buffer);

    return { path: `${uploadDir}/${sanitizedFilename}` };
  }
}
