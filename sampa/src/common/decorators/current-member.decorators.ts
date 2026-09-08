import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentMember = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.member;
  },
);
