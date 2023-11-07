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
import { InjectKnex, Knex } from 'nestjs-knex';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as dotenv from 'dotenv';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { LyricDto } from '../dto/lyric.dto';
import { ServersService } from 'src/servers/servers.service';

dotenv.config();

@Command({
  name: 'lyrics',
  description: 'Lightbulb moment, baby!',
  defaultMemberPermissions: null,
})
export class LyricsCommand {
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
  async onLyricsCommand(
    @InteractionEvent(SlashCommandPipe) dto: LyricDto,
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
