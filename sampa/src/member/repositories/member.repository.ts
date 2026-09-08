import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { DeepPartial, QueryRunner, Repository } from 'typeorm';
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
}
