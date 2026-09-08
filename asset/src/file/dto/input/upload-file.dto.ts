import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { FileTemplateTypeEnum } from 'src/common/enums/file-template-type.enum';

export class UploadFileDto {
  @ApiProperty({
    enum: FileTemplateTypeEnum,
    default: FileTemplateTypeEnum.SOC_TEMPLATE,
  })
  @IsEnum(FileTemplateTypeEnum)
  fileTemplateType: FileTemplateTypeEnum;
}
