import { BadRequestException, Injectable } from '@nestjs/common';
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import addErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ValidationService {
  private ajv: Ajv;

  constructor(private i18nService: I18nService) {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
    });
    ajvFormats(this.ajv);
    addErrors(this.ajv);
  }

  //------------------------------
  async validate<T>(schema: JSONSchemaType<T>, data: any): Promise<void> {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      throw new BadRequestException({
        message: this.i18nService.t('messages.ERROR_SCHEMA_VALIDATION_FAILED'),
        errors: validate.errors,
      });
    }
  }

  //------------------------------
  async validateSchema(schema: object): Promise<void> {
    let validate: ValidateFunction;

    try {
      validate = this.ajv.compile(schema);
    } catch (error) {
      throw new BadRequestException({
        message: this.i18nService.t('messages.ERROR_INVALID_JSON_SCHEMA'),
        errors: error.message,
      });
    }

    if (!validate({})) {
      throw new BadRequestException({
        message: this.i18nService.t('messages.ERROR_INVALID_JSON_SCHEMA'),
        errors: validate.errors,
      });
    }
  }
}
