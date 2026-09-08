import { BadRequestException, Injectable } from '@nestjs/common';
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import addErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

@Injectable()
export class ValidationService {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
    });
    ajvFormats(this.ajv);
    addErrors(this.ajv);
  }

  //------------------------------
  async validate<T>(
    schema: JSONSchemaType<T>,
    data: any,
  ): Promise<void | Error> {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      const errors = validate.errors?.map((err) => ({
        message: err.message,
        path: err.instancePath,
        schemaPath: err.schemaPath,
        params: err.params,
      }));
      const errMsg = errors?.map((err) => err.message).join(', ');
      throw new BadRequestException(errMsg);
    }
  }

  //------------------------------
  async validateExcelAsset<T>(
    assetName: string,
    schema: JSONSchemaType<T>,
    data: any,
  ): Promise<void | Error> {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      const errors = validate.errors?.map((err) => ({
        message: `${err.message} (path: ${err.instancePath}, params: ${JSON.stringify(err.params)})`,
        path: err.instancePath,
        schemaPath: err.schemaPath,
        params: err.params,
      }));

      let errMsg = `(Asset Type => ${assetName}) , `;
      errMsg += errors?.map((err) => err.message).join(', ');
      throw new BadRequestException(errMsg);
    }
  }

  //------------------------------
  async validateSchema(
    schema: object & { $id?: string; $schema?: string },
  ): Promise<void | Error> {
    let validate: ValidateFunction;
    delete schema.$id;
    delete schema.$schema;

    try {
      validate = this.ajv.compile(schema);
    } catch (error) {
      throw new BadRequestException([error.message]);
    }

    if (!validate({})) {
      throw new BadRequestException(validate.errors);
    }
  }
}
