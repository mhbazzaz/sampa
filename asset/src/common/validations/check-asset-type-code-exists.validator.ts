import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { AssetTypeService } from 'src/asset-type/services/asset-type.service';
import { Not } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class CheckAssetTypeCodeExistValidator
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly assetTypeService: AssetTypeService,
    private readonly i18nService: I18nService,
  ) {}

  async validate(text: string, args: ValidationArguments) {
    const assetType = await this.assetTypeService.findOne({
      where: {
        code: text || undefined,
        id: (args.object as any)['id']
          ? Not((args.object as any)['id'])
          : undefined,
      },
    });

    if (assetType) {
      return false;
    }
    return true;
  }

  defaultMessage() {
    return this.i18nService.t('validation.IsUnique', {
      args: { property: 'code' },
    });
  }
}

export const CheckAssetTypeCodeExist = (
  validationOptions?: ValidationOptions,
) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'CheckAssetTypeCodeExist',
      target: object!.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: CheckAssetTypeCodeExistValidator,
    });
  };
};
