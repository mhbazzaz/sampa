import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AssetStatusEnum } from 'src/common/enums/asset-status.enum';

export class AssetChangeStatusDto {
  @ApiProperty({
    enum: AssetStatusEnum,
  })
  @IsEnum(AssetStatusEnum)
  status: AssetStatusEnum;
}
