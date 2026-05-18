import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as fs from 'fs';
import { FileResponseDto } from 'src/asset/dto/response/upload-file-response.dto';
import { Action } from 'src/common/decorators/action.decorator';
import { CurrentUserRoles } from 'src/common/decorators/current-user-roles.decorators';
import { CurrentUser } from 'src/common/decorators/current-user.decorators';
import { Process } from 'src/common/decorators/process.decorator';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { multerConfig } from 'src/common/multer-configs/multer-config';
import { multerConfigExcel } from 'src/common/multer-configs/multer-config-excel';
import { UploadFileDto } from 'src/file/dto/input/upload-file.dto';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { ApplyFileQueryDto } from './dto/input/apply-file.dto';
import { FileService } from './file.service';

@Controller('')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  //------------------------------
  @ApiTags('Files')
  @ApiOperation({ summary: 'Upload An Excel File For Validating Assets' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileTemplateType: { type: 'string' },
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
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Save)
  @Process(ProcessEnum.AssetManagement)
  @Post('file/upload-assets')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadFile(
    @Body() data: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const result = await this.fileService.validateAndProcessFile(file, data);

      if (result.errors) {
        return res.status(400).json({
          message: result.message,
          referenceId: result.referenceId,
        });
      } else {
        return res.status(200).json({
          message: result.message,
          referenceId: result.referenceId,
        });
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //------------------------------
  @ApiTags('Files')
  @ApiOperation({ summary: 'Apply Assets In Excel File For Assets Creation' })
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Save)
  @Process(ProcessEnum.AssetManagement)
  @Post('file/apply-assets/:referenceId')
  async applyFile(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
    @Param('referenceId') referenceId: string,
    @Query() query: ApplyFileQueryDto,
    @Req() req: Request,
  ) {
    const result = await this.fileService.processFile(
      user,
      userRoles,
      req,
      referenceId,
      query,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //----------------------------------
  @ApiTags('Files')
  @ApiOperation({ summary: 'Download A File' })
  @ApiResponse({
    status: 200,
    description: 'File has been downloaded successfully!',
    type: FileResponseDto,
  })
  @Get('file/download/:referenceId')
  async download(
    @Param('referenceId') referenceId: string,
    @Res() res: Response,
  ) {
    const result = await this.fileService.download(referenceId);
    if (result) {
      const encodedFilename = encodeURIComponent('error_file.txt');

      res.set({
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename=${encodedFilename}`,
      });

      const fileStream = fs.createReadStream(result.filePath);
      return fileStream.pipe(res);
    }
  }

  //----------------------------------
  @ApiTags('Files')
  @ApiOperation({ summary: 'Download Excel Template Files' })
  @Get('files/excel-template')
  async getFileExcelTemplate(@Query() query: ApplyFileQueryDto) {
    return await this.fileService.getFileExcelTemplate(query);
  }

  //----------------------------------
  @ApiOperation({ summary: 'Upload An Excel Template File' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileTemplateType: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
          nullable: false,
        },
      },
    },
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Files')
  @Post('admin/files/upload-excel-template')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfigExcel))
  async saveFileExcelTemplate(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: UploadFileDto,
  ) {
    const result = await this.fileService.saveFileExcelTemplate(file, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
