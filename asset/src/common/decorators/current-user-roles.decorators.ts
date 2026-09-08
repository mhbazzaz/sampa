import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserRoles = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.userRoles;
  },
);
