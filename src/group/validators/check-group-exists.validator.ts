import { Injectable } from '@nestjs/common';
import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { GroupService } from '../services/group.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class CheckGroupExistValidator implements ValidatorConstraintInterface {
  constructor(
    private readonly groupsService: GroupService,
    private readonly i18nService: I18nService,
  ) {}

  async validate(text: string) {
    const group = await this.groupsService.findOne({
      where: { name: text },
    });

    if (group) {
      return false;
    }
    return true;
  }

  defaultMessage() {
    return 'گروه با این نام وجود دارد';
  }
}

export const CheckGroupExist = (validationOptions?: ValidationOptions) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'CheckGroupExist',
      target: object!.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: CheckGroupExistValidator,
    });
  };
};
