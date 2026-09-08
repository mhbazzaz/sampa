import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DeepPartial, FindOneOptions, FindOptionsWhere, ILike } from 'typeorm';
import { FindAllQueryDto } from '../dto/input/find-all-query-dto';
import { Member } from '../entities/member.entity';
import { MemberRepository } from '../repositories/member.repository';

@Injectable()
export class MemberService {
  constructor(private readonly memberRepository: MemberRepository) {}

  //------------------------------
  async create(data: DeepPartial<Member>): Promise<Member> {
    return this.memberRepository.save(data);
  }

  //------------------------------
  async findOne(data: FindOneOptions<Member>): Promise<Member | null> {
    return this.memberRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.memberRepository.findAll();
  }

  //------------------------------
  async update(data: FindOptionsWhere<Member>, updateMember: Partial<Member>) {
    return this.memberRepository.update(data, updateMember);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<Member>) {
    return this.memberRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(query: FindAllQueryDto) {
    return this.memberRepository.findAllPagination(query.skip, query.take, {
      order: { createdAt: 'DESC' },
      where: [
        {
          firstName: query.name ? ILike(`%${query.name}%`) : undefined,
          roles: { name: query.layer },
        },
        {
          lastName: query.name ? ILike(`%${query.name}%`) : undefined,
          roles: { name: query.layer },
        },
      ],
    });
  }

  //------------------------------
  async memberRoles(userId: string) {
    const user = await this.memberRepository.findOne({
      where: { id: userId },
      relations: { roles: { actions: { process: true } } },
    });

    if (!user) {
      throw new InternalServerErrorException();
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
