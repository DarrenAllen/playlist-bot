import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  Command,
  EventParams,
  Handler,
  InjectDiscordClient,
  InteractionEvent,
} from '@discord-nestjs/core';
import { ClientEvents, Client as DiscordClient } from 'discord.js';
import { Client } from 'spotify-api.js';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TABLES } from 'src/utils/constants';
import * as dotenv from 'dotenv';
import { pick } from 'lodash';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { IdeaDto } from '../dto/idea';
import { ServersService } from 'src/servers/servers.service';

dotenv.config();
const { SPOTIFY_ID, SPOTIFY_SECRET } = process.env;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
@Command({
  name: 'lyrics',
  description: 'Lightbulb moment, baby!',
  defaultMemberPermissions: null,
})
export class IdeaCommand {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly serverService: ServersService,
  ) {}
  async saveIdea(message: any, context: any, serverid: any) {
    await this.knex('ideas').insert({
      message,
      context: JSON.stringify(
        context,
        (key, value) => (typeof value === 'bigint' ? value.toString() : value), // return everything else unchanged
      ),
      serverid,
    });
  }
  @Handler()
  async onIdeaCommand(
    @InteractionEvent(SlashCommandPipe) dto: IdeaDto,
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<string> {
    console.info(args[0]);

    const server = await this.serverService.getServer(args[0].guildId);
    const context = args[0];
    setImmediate(
      async () => await this.saveIdea(dto.idea, context, server.serverid),
    );
    return `${dto.idea}`;
  }
}
