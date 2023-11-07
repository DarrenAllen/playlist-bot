import { Injectable } from '@nestjs/common';
import { ServersService } from 'src/servers/servers.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ContextService {
  constructor(
    private userService: UsersService,
    private readonly serverService: ServersService,
  ) {}
  async getContext(args: any) {
    const server = await this.serverService.getServer(args[0].guildId);
    // const discordid = ""
    const user = await this.userService.getUser({ discordid: args[0].user.id });
    return { user, server };
  }
}
