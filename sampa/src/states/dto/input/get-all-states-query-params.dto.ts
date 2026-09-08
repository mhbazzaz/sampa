import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { StateSideEnum } from 'src/common/enums/state-side.enum';

export class FindAllStatesQueryDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  processId: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  processName: string;

  @ApiPropertyOptional({
    enum: StateSideEnum,
  })
  @IsEnum(StateSideEnum, {
    message: i18nValidationMessage('validation.IsEnum'),
  })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  side?: StateSideEnum;
}
