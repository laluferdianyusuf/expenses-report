import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService, UserRepository } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}
