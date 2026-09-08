import * as multer from 'multer';

export const multerConfig = {
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    cb(null, true);
  },

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
};
