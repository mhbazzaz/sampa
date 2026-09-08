import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Action } from 'src/action/entities/action.entity';
import { Process } from 'src/process/entities/process.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource, In } from 'typeorm';
import { AuthorizationMetaDataEnum } from '../enums/authorization-meta-data.enum';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    protected readonly reflector: Reflector,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const process = this.reflector.get<string>(
      AuthorizationMetaDataEnum.Process,
      context.getHandler(),
    );
    const action = this.reflector.get<string>(
      AuthorizationMetaDataEnum.Action,
      context.getHandler(),
    );

    if (!request.user) {
      throw new UnauthorizedException();
    }

    try {
      const user = await this.dataSource.getRepository(User).findOne({
        where: { id: request.user.id },
        relations: { roles: true },
      });

      if (user) {
        if (!user.isEnable) {
          throw new ForbiddenException('User account is disabled');
        }
      }
      if (!user || !user.roles || user.roles.length === 0) {
        throw new ForbiddenException('User has no roles assigned');
      }

      const processRecord = await this.dataSource
        .getRepository(Process)
        .findOne({
          where: { name: process },
        });
      if (!processRecord) {
        throw new InternalServerErrorException();
      }

      const actionRecord = await this.dataSource.getRepository(Action).find({
        where: {
          name: Array.isArray(action) ? In(action) : action,
          processId: processRecord.id,
        },
      });
      if (!actionRecord) {
        throw new InternalServerErrorException();
      }

      const roles = user.roles.map((role) => `'${role.id}'`);

      const actionRecords = actionRecord.map(
        (actionRecord) => `'${actionRecord.id}'`,
      );
      const actionRoleRecord = await this.dataSource.query(
        `SELECT * FROM "action_role" where "actionId" IN (${actionRecords.join(',')}) AND "roleId" IN (${roles.join(',')})`,
      );

      if (actionRoleRecord.length === 0) {
        throw new ForbiddenException();
      }
      request.userRoles = user.roles;

      return true;
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ForbiddenException();
    }
  }
}
