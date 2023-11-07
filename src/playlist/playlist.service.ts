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
  async getPlaylistIdFromLink(playlistLink: string) {
    // like https://open.spotify.com/playlist/2YJuXYd3kfCxQkOznKpgGZ?si=4006612ec2c64561
    console.info(playlistLink);
    const regexPattern = /\/([^\/?]+)(\?.*)?$/;

    const match = playlistLink.match(regexPattern);

    if (match && match[1]) {
      const extractedValue = match[1];
      console.log('Extracted value:', extractedValue);
    } else {
      console.log('No match found.');
    }
  }
}
