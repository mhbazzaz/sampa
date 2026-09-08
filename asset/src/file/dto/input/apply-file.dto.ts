import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { FileTemplateTypeEnum } from 'src/common/enums/file-template-type.enum';

export class ApplyFileQueryDto {
  @ApiProperty()
  @IsEnum(FileTemplateTypeEnum, {})
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  template: FileTemplateTypeEnum;
}
