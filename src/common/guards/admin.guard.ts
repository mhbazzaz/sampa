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
export class AdminGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException();
    }

    try {
      const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

      const { data } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/admins/current-admin`,
        {
          headers: {
            authorization: authorization,
          },
        },
      );

      request.admin = data;
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }
}
