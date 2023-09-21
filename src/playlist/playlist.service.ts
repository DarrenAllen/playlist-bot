import { InjectDiscordClient } from '@discord-nestjs/core';
import { Client as DiscordClient } from 'discord.js';
import { InjectKnex, Knex } from 'nestjs-knex';

import { UsersService } from 'src/users/users.service';
import { Injectable } from '@nestjs/common';
import { TABLES } from 'src/utils/constants';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    private readonly userService: UsersService,
  ) {}
  async getPlaylistArtists(playlistId: string) {
    const result = await this.knex.raw(
      `SELECT track->'track'->'artists'->0->>'uri' as uri
      from ${TABLES.tracks}
        where playlistid = ?`,
      [playlistId],
    );
    return result.rows;
  }
}
