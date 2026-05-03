import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentMemberRoles = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.userRoles;
  },
);
