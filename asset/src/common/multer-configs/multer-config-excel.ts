import { BadRequestException } from '@nestjs/common';
import * as multer from 'multer';
import { extname } from 'path';
import { allowedExcelMimeTypes } from './allowed-excel';

export const multerConfigExcel = {
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const fileExtension = extname(file.originalname).toLowerCase();
    const expectedMimeType = allowedExcelMimeTypes[fileExtension];

    if (expectedMimeType && file.mimetype === expectedMimeType) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Unsupported file type ${fileExtension} or mismatched MIME type`,
        ),
        false,
      );
    }
  },

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
};
