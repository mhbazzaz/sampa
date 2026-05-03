import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { Vault } from 'src/vault/vault';

@Injectable()
export class UserGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException();
    }

    try {
      const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

      const currentUser = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/users/current-user`,
        {
          headers: {
            authorization: authorization,
          },
        },
      );

      request.member = currentUser.data.data;
      return true;
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }
}
