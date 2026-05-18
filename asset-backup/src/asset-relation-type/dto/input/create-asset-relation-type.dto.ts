import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AssetRelation } from 'src/asset/entities/asset-relation.entity';
import { RelationDirection } from 'src/common/enums/relation-direction.enum';
import { CheckAssetRelationTypeExist } from 'src/common/validations/check-asset-relation-type-exists.validator';

export class CreateAssetRelationTypeDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @CheckAssetRelationTypeExist()
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  name: string;

  @ApiProperty()
  @IsEnum(RelationDirection)
  @IsOptional()
  direction: RelationDirection;

  @ApiProperty({ type: () => [AssetRelation] })
  @IsOptional()
  assetRelations?: AssetRelation[];
}
