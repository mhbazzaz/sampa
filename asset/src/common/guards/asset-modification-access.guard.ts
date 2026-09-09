import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssetVersionRepository } from 'src/asset/repositories/asset-version.repository';
import { AssetService } from 'src/asset/services/asset.service';
import { Role } from 'src/role/entities/role.entity';
import { AssetRoles } from '../enums/asset-roles.enum';

@Injectable()
export class AssetModificationAccessGuard implements CanActivate {
  private readonly userScopeLogger = new Logger('UserScope');

  constructor(
    private readonly i18nService: I18nService,
    private readonly assetVersionRepository: AssetVersionRepository,
    private readonly assetService: AssetService,
  ) {}

  private logUserScope(
    traceId: string,
    step: string,
    details: Record<string, unknown> = {},
  ) {
    this.userScopeLogger.log(
      JSON.stringify({
        tag: 'USER_SCOPE',
        traceId,
        step,
        ...details,
      }),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const avId = request.params?.id;
    const user = request.user;
    const userRoles: Role[] = request.userRoles;
    const unauthorizedMessage = this.i18nService.t(
      'messages.ERROR_NOT_AUTHORIZED_TO_CREATE_OR_UPDATE_ASSET',
    );
    const traceId = `us-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const hasAdministratorRole = (userRoles || []).some(
      (r) => r.name === AssetRoles.AssetAdministrator,
    );

    if (hasAdministratorRole) {
      this.logUserScope(traceId, 'guard.allow', {
        reason: 'administrator',
        username: user?.username,
        userId: user?.id,
        avId: avId ?? null,
      });
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

    const hasSupervisorRole = (userRoles || []).some(
      (r) => r.name === AssetRoles.AssetSupervisor,
    );
    const hasAuditorRole = (userRoles || []).some(
      (r) => r.name === AssetRoles.AssetAuditor,
    );
    const hasUserRole = (userRoles || []).some(
      (r) => r.name === AssetRoles.AssetUser,
    );

    this.logUserScope(traceId, 'guard.start', {
      username: user?.username,
      userId: user?.id,
      avId: avId ?? null,
      accountableId,
      editorId,
      roleNames: (userRoles || []).map((role) => role.name),
      hasAdministratorRole,
      hasSupervisorRole,
      hasAuditorRole,
      hasUserRole,
    });

    if (hasAuditorRole) {
      this.logUserScope(traceId, 'guard.allow', {
        reason: 'auditor',
        username: user?.username,
      });
      return true;
    }

    if (hasSupervisorRole) {
      const supervisorScopeIds = await this.assetService.buildSupervisorScope(
        user.username,
        user.id,
        traceId,
      );

      const hasAccess =
        (accountableId && supervisorScopeIds.includes(accountableId)) ||
        (editorId && supervisorScopeIds.includes(editorId));

      this.logUserScope(traceId, hasAccess ? 'guard.allow' : 'guard.deny', {
        reason: 'supervisor',
        username: user?.username,
        accountableId,
        editorId,
        supervisorCount: supervisorScopeIds.length,
        supervisorScopeIds,
        hasAccess,
      });

      if (hasAccess) return true;

      throw new ForbiddenException(unauthorizedMessage);
    }

    if (hasUserRole) {
      if (user.id === accountableId || user.id === editorId) {
        this.logUserScope(traceId, 'guard.allow', {
          reason: 'asset-user-direct',
          username: user?.username,
          userId: user.id,
          accountableId,
          editorId,
        });
        return true;
      }

      const assetUserScopeIds = await this.assetService.buildAssetUserScope(
        user.username,
        user.id,
        traceId,
      );

      const hasAccess =
        (accountableId && assetUserScopeIds.includes(accountableId)) ||
        (editorId && assetUserScopeIds.includes(editorId));

      this.logUserScope(traceId, hasAccess ? 'guard.allow' : 'guard.deny', {
        reason: 'asset-user-scope',
        username: user?.username,
        accountableId,
        editorId,
        assetUserCount: assetUserScopeIds.length,
        assetUserScopeIds,
        hasAccess,
      });

      if (hasAccess) return true;

      throw new ForbiddenException(unauthorizedMessage);
    }

    this.logUserScope(traceId, 'guard.deny', {
      reason: 'no-matching-role',
      username: user?.username,
    });

    throw new ForbiddenException(unauthorizedMessage);
  }
}
