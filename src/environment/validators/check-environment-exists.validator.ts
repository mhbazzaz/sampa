import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { Not } from 'typeorm';
import { EnvironmentService } from '../services/environment.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class CheckEnvironmentExistValidator
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly environmentsService: EnvironmentService,
    private readonly i18nService: I18nService,
  ) {}

  async validate(text: string, args: ValidationArguments) {
    const environment = await this.environmentsService.findOne({
      where: {
        name: text,
        id: (args.object as any)['id']
          ? Not((args.object as any)['id'])
          : undefined,
      },
    });

    if (environment) {
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

export const CheckEnvironmentExist = (
  validationOptions?: ValidationOptions,
) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'CheckEnvironmentExist',
      target: object!.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: CheckEnvironmentExistValidator,
    });
  };
};
