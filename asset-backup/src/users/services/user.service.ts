import { Injectable, UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { UsersRepository } from '../repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async userRoles(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { roles: { actions: { process: true } } },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: {
            property: 'User',
          },
        }),
      );
    }

    const actions: { action: string; process: string }[] = [];
    for (let i = 0; i < user.roles!.length; i++) {
      const role = user.roles![i];

      for (let j = 0; j < role.actions!.length; j++) {
        const action = role.actions![j];
        actions.push({ action: action.name, process: action.process!.name });
      }
    }

    return { actions };
  }
}
