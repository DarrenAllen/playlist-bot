import { Injectable, Inject } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TABLES } from 'src/utils/constants';
@Injectable()
export class UsersService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async getUsers(serverid = 1) {
    const cachedResult: any[] = await this.cacheManager.get(
      `users_${serverid}`,
    );

    if (cachedResult) {
      return cachedResult;
    } else {
      const users = await this.knex(TABLES.users).select().where({ serverid });
      await this.cacheManager.set(`users_${serverid}`, users); // a day
      return users;
    }
  }
  async getUser({ uri, nickname }: { uri?: string; nickname?: string }) {
    const q: any = {};
    if (uri) {
      q.externalid = uri;
    } else if (nickname) {
      q.nickname = nickname;
    } else throw new Error('no query provided');
    return await this.knex(TABLES.users).select().where(q).first();
  }
}
