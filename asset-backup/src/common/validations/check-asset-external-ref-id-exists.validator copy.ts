import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { AssetRepository } from 'src/asset/repositories/asset.repository';
import { Not } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class CheckAssetExternalRefIdExistValidator
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly i18nService: I18nService,
  ) {}

  async validate(text: string, args: ValidationArguments) {
    const asset = await this.assetRepository.findOne({
      where: {
        externalRefId: text || undefined,
        id: (args.object as any)['assetId']
          ? Not((args.object as any)['assetId'])
          : undefined,
      },
    });

    if (asset) {
      return false;
    }
    return true;
  }

  defaultMessage() {
    return this.i18nService.t('validation.IsUnique', {
      args: { property: 'externalRefId' },
    });
  }
}

export const CheckAssetExternalRefIdExist = (
  validationOptions?: ValidationOptions,
) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'CheckAssetExternalRefIdExist',
      target: object!.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: CheckAssetExternalRefIdExistValidator,
    });
  };
};
