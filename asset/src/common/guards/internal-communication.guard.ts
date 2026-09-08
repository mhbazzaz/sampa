import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Vault } from 'src/vault/vault';

@Injectable()
export class InternalCommunicationGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.headers['x-internal-communication-token'];

    if (!token) {
      throw new UnauthorizedException();
    }

    const ASSET_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'ASSET_SERVICE_INTERNAL_TOKEN',
      'share',
    );

    if (token !== ASSET_SERVICE_INTERNAL_TOKEN) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
