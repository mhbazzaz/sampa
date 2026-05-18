import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { LocationRepository } from 'src/location/repositories/location.repository';
import { Not } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class CheckLocationCodeExistValidator
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly locationRepository: LocationRepository,
    private readonly i18nService: I18nService,
  ) {}

  async validate(text: string, args: ValidationArguments) {
    const location = await this.locationRepository.findOne({
      where: {
        code: text || undefined,
        id: (args.object as any)['id']
          ? Not((args.object as any)['id'])
          : undefined,
      },
    });

    if (location) {
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

export const CheckLocationCodeExist = (
  validationOptions?: ValidationOptions,
) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'CheckLocationCodeExist',
      target: object!.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: CheckLocationCodeExistValidator,
    });
  };
};
