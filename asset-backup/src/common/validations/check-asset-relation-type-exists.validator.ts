import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { AssetRelationTypeService } from 'src/asset-relation-type/services/asset-relation-type.service';
import { Not } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class CheckAssetRelationTypeExistValidator
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly assetRelationTypeService: AssetRelationTypeService,
    private readonly i18nService: I18nService,
  ) {}

  async validate(text: string, args: ValidationArguments) {
    const assetRelationType = await this.assetRelationTypeService.findOne({
      where: {
        name: text || undefined,
        id: (args.object as any)['id']
          ? Not((args.object as any)['id'])
          : undefined,
      },
    });

    if (assetRelationType) {
      return false;
    }
    return true;
  }

  defaultMessage() {
    return this.i18nService.t('validation.IsUnique', {
      args: { property: 'name' },
    });
  }
}

export const CheckAssetRelationTypeExist = (
  validationOptions?: ValidationOptions,
) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'CheckAssetRelationTypeExist',
      target: object!.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: CheckAssetRelationTypeExistValidator,
    });
  };
};
