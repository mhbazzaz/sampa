import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssetVersionRepository } from 'src/asset/repositories/asset-version.repository';
import { AssetService } from 'src/asset/services/asset.service';
import { Role } from 'src/role/entities/role.entity';
import { AssetRoles } from '../enums/asset-roles.enum';

@Injectable()
export class AssetModificationAccessGuard implements CanActivate {
  constructor(
    private readonly i18nService: I18nService,
    private readonly assetVersionRepository: AssetVersionRepository,
    private readonly assetService: AssetService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const avId = request.params?.id;
    const user = request.user;
    const userRoles: Role[] = request.userRoles;
    const unauthorizedMessage = this.i18nService.t(
      'messages.ERROR_NOT_AUTHORIZED_TO_CREATE_OR_UPDATE_ASSET',
    );

    const hasAdministratorRole = userRoles.some(
      (r) => r.name === AssetRoles.AssetAdministrator,
    );

    if (hasAdministratorRole) {
      return true;
    }

    let accountableId: string | null = null;
    let editorId: string | null = null;

    if (avId) {
      const av = await this.assetVersionRepository.findOne({
        where: { id: avId },
      });
      if (av) {
        accountableId = av.accountableId;
        editorId = av.editorId;
      }
    } else {
      accountableId = request.body?.accountableId || null;
      editorId = request.body?.editorId || null;
    }

    const hasSupervisorRole = userRoles.some(
      (r) => r.name === AssetRoles.AssetSupervisor,
    );
    const hasAuditorRole = userRoles.some(
      (r) => r.name === AssetRoles.AssetAuditor,
    );
    const hasUserRole = userRoles.some((r) => r.name === AssetRoles.AssetUser);

    if (hasAuditorRole) {
      return true;
    }

    if (hasSupervisorRole) {
      const supervisorScopeIds = await this.assetService.buildSupervisorScope(
        user.username,
        user.id,
      );

      const hasAccess =
        (accountableId && supervisorScopeIds.includes(accountableId)) ||
        (editorId && supervisorScopeIds.includes(editorId));

      if (hasAccess) return true;

      throw new ForbiddenException(unauthorizedMessage);
    }

    if (hasUserRole) {
      if (user.id === accountableId || user.id === editorId) {
        return true;
      }

      const assetUserScopeIds = await this.assetService.buildAssetUserScope(
        user.username,
        user.id,
      );

      const hasAccess =
        (accountableId && assetUserScopeIds.includes(accountableId)) ||
        (editorId && assetUserScopeIds.includes(editorId));

      if (hasAccess) return true;

      throw new ForbiddenException(unauthorizedMessage);
    }

    throw new ForbiddenException(unauthorizedMessage);
  }
}
