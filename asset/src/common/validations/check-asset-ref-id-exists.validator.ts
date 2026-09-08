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
export class CheckAssetRefIdExistValidator
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly i18nService: I18nService,
  ) {}

  async validate(text: string, args: ValidationArguments) {
    const asset = await this.assetRepository.findOne({
      where: {
        referenceId: text || undefined,
        id: (args.object as any)['id']
          ? Not((args.object as any)['id'])
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
      args: { property: 'referenceId' },
    });
  }
}

export const CheckAssetRefIdExist = (validationOptions?: ValidationOptions) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'CheckAssetRefIdExist',
      target: object!.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: CheckAssetRefIdExistValidator,
    });
  };
};
