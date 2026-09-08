import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupModule } from 'src/group/group.module';
import { MemberModule } from 'src/member/member.module';
import { GroupMembershipController } from './controllers/group-membership.controller';
import { GroupMembership } from './entities/group-membership.entity';
import { GroupMembershipRepository } from './repositories/group-membership.repository';
import { GroupMembershipService } from './services/group-membership.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupMembership]),
    forwardRef(() => GroupModule),
    MemberModule,
  ],
  controllers: [GroupMembershipController],
  providers: [GroupMembershipService, GroupMembershipRepository],
  exports: [GroupMembershipService, GroupMembershipRepository],
})
export class GroupMembershipModule {}
