import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Valide que la date (ISO string ou Date) est strictement dans le futur.
 */
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string | Date) {
          if (value == null) return false;
          const date = typeof value === 'string' ? new Date(value) : value;
          if (Number.isNaN(date.getTime())) return false;
          return date.getTime() > Date.now();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} doit être une date future`;
        },
      },
    });
  };
}
