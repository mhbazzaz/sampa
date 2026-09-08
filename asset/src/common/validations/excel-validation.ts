import { BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';

export const defineJoiSchema = (template: any[]): Joi.ObjectSchema => {
  const schema: Record<string, Joi.Schema> = {};
  for (const field of template) {
    let joiRule: Joi.Schema;

    switch (field?.type) {
      case 'string':
        joiRule = Joi.string().allow(null, '').optional();
        if (field.regex) {
          joiRule = (joiRule as Joi.StringSchema)
            .pattern(field.regex)
            .messages({
              'string.pattern.base': `Field '${field.name}' must match pattern: ${field.regex}`,
            });
        }
        if (field.enum) {
          joiRule = joiRule.valid(...field.enum, null).messages({
            'any.only': `Field '${field.name}' must be one of: ${field.enum.join(', ')}`,
          });
        }
        break;

      case 'number':
        joiRule = Joi.number().messages({
          'number.base': `Field '${field.name}' must be a number`,
        });
        break;

      case 'boolean':
        joiRule = Joi.boolean().messages({
          'boolean.base': `Field '${field.name}' must be true or false`,
        });
        break;

      case 'array':
        if (field.items && typeof field.items === 'object') {
          joiRule = Joi.array()
            .items(defineJoiSchema(field.items))
            .messages({
              'array.base': `Field '${field.name}' must be an array`,
            });
        } else {
          joiRule = Joi.array()
            .items(Joi.string())
            .messages({
              'array.base': `Field '${field.name}' must be an array of strings`,
            });
        }
        break;

      case 'object':
        joiRule = Joi.object(defineJoiSchema(field.properties || {})).messages({
          'object.base': `Field '${field.name}' must be an object`,
        });
        break;

      case 'any':
        joiRule = Joi.any().messages({
          'any.required': `Field '${field.name}' is required`,
        });
        break;

      default:
        throw new BadRequestException(`Unsupported type: ${field?.type}`);
    }

    if (field.required) {
      joiRule = joiRule.required().messages({
        'any.required': `Field '${field.name}' is required`,
      });
    }

    schema[field.name] = joiRule.label(field.name);
  }

  return Joi.object(schema);
};

//------------------------------
export const validateObjectArray = (
  rowNumber: number,
  validationSchema: Joi.ObjectSchema,
  dataArray: any[],
) => {
  if (!Array.isArray(dataArray)) {
    throw new BadRequestException('Input should be an array of objects');
  }

  if (dataArray.length === 0) {
    throw new BadRequestException('Input should not be empty');
  }

  const errors: string[] = [];

  dataArray.forEach((data) => {
    const { error } = validationSchema.validate(data, { abortEarly: false });

    if (error) {
      error.details.forEach((err) => {
        const fieldName = err.path?.join('.') || 'Unknown Field';

        let errorMessage = `Row ${rowNumber} - Field '${fieldName}': ${err.message}`;

        switch (err.type) {
          case 'any.required':
            errorMessage = `Row ${rowNumber} - Field '${fieldName}' is required.`;
            break;
          case 'string.pattern.base':
            errorMessage = `Row ${rowNumber} - Field '${fieldName}' does not match required format.`;
            break;
          case 'string.base':
            errorMessage = `Row ${rowNumber} - Field '${fieldName}' must be a string.`;
            break;
          case 'number.base':
            errorMessage = `Row ${rowNumber} - Field '${fieldName}' must be a number.`;
            break;
          case 'any.only':
            errorMessage = `Row ${rowNumber} - Field '${fieldName}' must be one of: ${err.context?.valids?.join(', ')}.`;
            break;
          case 'array.base':
            errorMessage = `Row ${rowNumber} - Field '${fieldName}' must be an array.`;
            break;
          case 'object.base':
            errorMessage = `Row ${rowNumber} - Field '${fieldName}' must be an object.`;
            break;
          default:
            errorMessage = `Row ${rowNumber} - Field '${fieldName}': ${err.message}`;
        }

        errors.push(errorMessage);
      });
    }
  });

  if (errors.length) {
    return { errors, data: null };
  } else {
    return { errors: null, data: dataArray };
  }
};
