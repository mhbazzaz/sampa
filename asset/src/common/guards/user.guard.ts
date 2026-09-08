import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { Vault } from 'src/vault/vault';
import { IDPUser } from '../interfaces/idp-user';

@Injectable()
export class UserGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');
      const { data } = await axios.get<{ data: IDPUser }>(
        `${IDP_SERVICE_URL}/idp/api/v1/users/current-user`,
        {
          headers: {
            Cookie: request.headers.cookie,
            'Content-Type':
              request.headers['content-type'] || 'application/json',
          },
          withCredentials: true,
        },
      );

      request.user = data.data;
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }
}
