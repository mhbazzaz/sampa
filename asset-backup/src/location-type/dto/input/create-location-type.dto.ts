import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CheckLocationTypeNameExist } from 'src/common/validations/check-location-type-name-exists.validator';
import { LocationTypeCategoryEnum } from 'src/location-type/entities/location-type.entity';

export class CreateLocationTypeDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  @CheckLocationTypeNameExist()
  name: string;

  @ApiProperty()
  @IsEnum(LocationTypeCategoryEnum)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  category: LocationTypeCategoryEnum;
}
