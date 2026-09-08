import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { I18nService } from 'nestjs-i18n';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { multerOptions } from 'src/common/multer-config/file-storage';
import { Dotenv } from 'src/config/dotenv';
import { CreateFileDto } from '../dto/input/create-file.dto';
import { FileResponseDto } from '../dto/response/file-response.dto';
import { FileService } from '../services/file.service';

@ApiTags('Files')
@Controller('file')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly i18nService: I18nService,
  ) {}

  //----------------------------------
  @ApiOperation({ summary: 'Save A File' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File has been saved successfully!',
    type: FileResponseDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.InitiatedSave)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(
    @Body() data: CreateFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        this.i18nService.t('validation.IsNotEmpty', {
          args: { property: 'file' },
        }),
      );
    }

    const result = await this.fileService.upload(data, file);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: 'Upload Image For Test-case Items Or Test-case Contents',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize:
          (Dotenv.instance.env.TEXT_EDITOR_FILE_UPLOAD_MAX_SIZE_KILOBYTE
            ? Dotenv.instance.env.TEXT_EDITOR_FILE_UPLOAD_MAX_SIZE_KILOBYTE
            : 1024) * 1024,
      },
    }),
  )
  @Post('upload-image')
  async handleImageUpload(@UploadedFile() file: Express.Multer.File) {
    const result = await this.fileService.handleImageUpload(file);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: 'Upload Image For Test-case Items Or Test-case Contents',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseGuards(AdminGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize:
          (Dotenv.instance.env.TEXT_EDITOR_FILE_UPLOAD_MAX_SIZE_KILOBYTE
            ? Dotenv.instance.env.TEXT_EDITOR_FILE_UPLOAD_MAX_SIZE_KILOBYTE
            : 1024) * 1024,
      },
    }),
  )
  @Post('admin/upload-image')
  async handleImageUploadAdmin(@UploadedFile() file: Express.Multer.File) {
    const result = await this.fileService.handleImageUpload(file);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //----------------------------------
  @ApiOperation({ summary: 'Download A File' })
  @ApiResponse({
    status: 200,
    description: 'File has been downloaded successfully!',
    type: FileResponseDto,
  })
  // @UseGuards(AuthorizationGuard)
  // @UseGuards(UserGuard)
  // @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.Read)
  // @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('download/:referenceId')
  async download(
    @Param('referenceId') referenceId: string,
    @Res() res: Response,
  ) {
    const result = await this.fileService.download(referenceId);
    const encodedFilename = encodeURIComponent(result.originalFilename);

    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename=${encodedFilename}`,
    });

    const fileStream = fs.createReadStream(result.filePath);
    return fileStream.pipe(res);
  }
}
