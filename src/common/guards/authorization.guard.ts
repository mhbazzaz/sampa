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
import { Member } from 'src/member/entities/member.entity';
import { Process } from 'src/process/entities/process.entity';
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

    const { body } = request;

    const process = this.reflector.get<string>(
      AuthorizationMetaDataEnum.Process,
      context.getHandler(),
    );
    const action = this.reflector.get<string>(
      AuthorizationMetaDataEnum.Action,
      context.getHandler(),
    );

    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException();
    }

    try {
      const member = await this.dataSource.getRepository(Member).findOne({
        where: { id: request.member.id },
        relations: { roles: true },
      });

      if (member) {
        if (!member.isEnable) {
          throw new ForbiddenException('حساب کاربری غیرفعال است');
        }
      }

      if (!member || !member.roles || member.roles.length === 0) {
        throw new ForbiddenException('کاربر دسترسی ندارد');
      }

      const processRecord = await this.dataSource
        .getRepository(Process)
        .findOne({
          where: { name: process },
        });
      if (!processRecord) {
        throw new InternalServerErrorException(`process not found: ${process}`);
      }

      const actionRecord = await this.dataSource.getRepository(Action).find({
        where: {
          name: Array.isArray(action) ? In(action) : action,
          processId: processRecord.id,
        },
      });

      if (!actionRecord || actionRecord.length === 0) {
        throw new InternalServerErrorException(
          `action not found: name: ${action} _ processId: ${processRecord.id}`,
        );
      }

      if (body.action && !action.includes(body.action)) {
        throw new ForbiddenException();
      }

      const roles = member.roles.map((role) => `'${role.id}'`);
      const actionRecords = actionRecord.map(
        (actionRecord) => `'${actionRecord.id}'`,
      );
      const actionRoleRecord = await this.dataSource.query(
        `SELECT * FROM "action_role" where "actionId" IN (${actionRecords.join(',')}) AND "roleId" IN (${roles.join(',')})`,
      );

      if (actionRoleRecord.length === 0) {
        throw new ForbiddenException();
      }

      request.userRoles = member.roles;
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
