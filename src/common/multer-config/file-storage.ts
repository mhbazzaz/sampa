import { BadRequestException } from '@nestjs/common';
import * as multer from 'multer';
import { extname } from 'path';
import { allowedMimeTypes } from './allowed-type';

export const multerConfig = {
  dest: 'upload/',
};

export const multerOptions = {
  fileFilter: (req: any, file: any, cb: any) => {
    const fileExtension = extname(file.originalname).toLowerCase();
    const expectedMimeType = allowedMimeTypes[fileExtension];

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
    fileSize: 50 * 1024 * 1024,
  },
};
