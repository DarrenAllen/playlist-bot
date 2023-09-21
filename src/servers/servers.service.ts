import { Injectable, Inject } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TABLES } from 'src/utils/constants';
@Injectable()
export class ServersService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async getServers() {
    const cachedResult: any[] = await this.cacheManager.get('servers');

    if (cachedResult) {
      return cachedResult;
    } else {
      const servers = await this.knex(TABLES.servers).select();
      await this.cacheManager.set('servers', servers); // a day
      return servers;
    }
  }
  async getServer(guildId) {
    const servers = await this.getServers();
    return servers.find((server) => server.guildid === guildId);
  }
}
