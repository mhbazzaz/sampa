import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { DeepPartial, In, QueryRunner, Repository } from 'typeorm';
import { Member } from '../entities/member.entity';

@Injectable()
export class MemberRepository extends AbstractRepository<Member> {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private i18nService: I18nService,
  ) {
    super(memberRepository, i18nService);
  }

  //------------------------------
  async saveTransactionable(
    entity: DeepPartial<Member>,
    queryRunner: QueryRunner,
  ) {
    return queryRunner.manager.save(Member, entity);
  }

  //------------------------------
  async findCiso() {
    return this.memberRepository
      .createQueryBuilder('member')
      .innerJoin('member.roles', 'role')
      .where("role.name = 'ciso'")
      .getOneOrFail();
  }

  //------------------------------
  async findIdentitiesByIds(ids: string[]): Promise<Member[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.memberRepository.find({
      select: { id: true, username: true },
      where: { id: In(ids) },
    });
  }

  //------------------------------
  async findIdentitiesByUsernames(usernames: string[]): Promise<Member[]> {
    if (usernames.length === 0) {
      return [];
    }

    const unique = Array.from(
      new Set(usernames.map((username) => username.toLowerCase())),
    );
    const withDomainPrefix = unique.map((username) => `iranet\\${username}`);

    return this.memberRepository
      .createQueryBuilder('member')
      .select(['member.id', 'member.username'])
      .where('member.username IS NOT NULL')
      .andWhere('LOWER(member.username) IN (:...usernames)', {
        usernames: [...unique, ...withDomainPrefix],
      })
      .getMany();
  }
}
