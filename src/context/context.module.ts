import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { ServersService } from 'src/servers/servers.service';
import { ContextService } from './context.service';

@Module({
  imports: [DiscordModule.forFeature()],
  exports: [ContextService],
  providers: [UsersService, ServersService, ContextService],
})
export class ContextModule {}
