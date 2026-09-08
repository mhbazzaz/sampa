// import { Injectable } from '@nestjs/common';
// import {
//   ValidationArguments,
//   ValidationOptions,
//   ValidatorConstraint,
//   ValidatorConstraintInterface,
//   registerDecorator,
// } from 'class-validator';
// import { I18nService } from 'nestjs-i18n';
// import { TestcaseItemService } from 'src/test-case/services/test-case-item.service';
// import { Not } from 'typeorm';

// @ValidatorConstraint({ async: true })
// @Injectable()
// export class CheckTestcaseItemExistValidator
//   implements ValidatorConstraintInterface
// {
//   constructor(
//     private readonly testcaseItemService: TestcaseItemService,
//     private readonly i18nService: I18nService,
//   ) {}

//   async validate(text: string, args: ValidationArguments) {
//     const testItemGroup = await this.testcaseItemService.findOne({
//       where: {
//         name: text || undefined,
//         id: (args.object as any)['id']
//           ? Not((args.object as any)['id'])
//           : undefined,
//       },
//     });

//     if (testItemGroup) {
//       return false;
//     }
//     return true;
//   }

//   defaultMessage() {
//     return this.i18nService.t('validation.IsUnique', {
//       args: { property: 'name' },
//     });
//   }
// }

// export const CheckTestcaseItemExist = (
//   validationOptions?: ValidationOptions,
// ) => {
//   return (object: unknown, propertyName: string) => {
//     registerDecorator({
//       name: 'CheckTestcaseItemExist',
//       target: object!.constructor,
//       propertyName: propertyName,
//       constraints: [],
//       options: validationOptions,
//       validator: CheckTestcaseItemExistValidator,
//     });
//   };
// };
