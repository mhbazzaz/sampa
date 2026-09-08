import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberController } from './controllers/member.controller';
import { Member } from './entities/member.entity';
import { MemberRepository } from './repositories/member.repository';
import { MemberService } from './services/member.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Member])],
  controllers: [MemberController],
  providers: [MemberService, MemberRepository],
  exports: [MemberService, MemberRepository],
})
export class MemberModule {}
