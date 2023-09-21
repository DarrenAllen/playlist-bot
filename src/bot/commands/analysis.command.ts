import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  Command,
  EventParams,
  Handler,
  InjectDiscordClient,
} from '@discord-nestjs/core';
import { ClientEvents, Client as DiscordClient } from 'discord.js';
import { Client } from 'spotify-api.js';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TABLES } from 'src/utils/constants';
import { ServersService } from 'src/servers/servers.service';

import * as dotenv from 'dotenv';
dotenv.config();
const { SPOTIFY_ID, SPOTIFY_SECRET } = process.env;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
@Command({
  name: 'analysis',
  description: 'Updates stored analysis data, use sparingly',
})
export class AnalysisCommand {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly serverService: ServersService,
  ) {}
  async getTrackAnalysis(trackId) {
    const client = await Client.create({
      token: {
        clientID: SPOTIFY_ID,
        clientSecret: SPOTIFY_SECRET,
      },
    });

    // get the tracks from the playlist
    const analysis = await client.tracks.getAudioAnalysis(trackId);
    // const features = await client.tracks.getAudioFeatures(trackId);
    // console.info('anal', analysis);
    return analysis;
  }

  async archiveAnalysis(playlistid) {
    const tracksToProcess = await this.knex(TABLES.tracks)
      .select('uri')
      .whereNull('analysis')
      .andWhere({ playlistid });

    for (const track of tracksToProcess) {
      // like spotify:track:3XH68VARiffUSObLtIkp2J => 3XH68VARiffUSObLtIkp2J
      const trackId = track.uri.split(':').slice(-1)[0];
      let analysis;
      try {
        analysis = await this.getTrackAnalysis(trackId);
      } catch (error) {
        console.error('ERROR GETTING ANALYSIS', error);
        throw new Error(error);
      }

      await this.knex(TABLES.tracks)
        .update({ analysis: JSON.stringify(analysis) })
        .where('uri', track.uri);
      await sleep(3000);
    }
  }

  @Handler()
  async onAnalysisCommand(
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<string> {
    const server = await this.serverService.getServer(args[0].guildId);

    const playlistId = server.playlistid;
    setImmediate(() => this.archiveAnalysis(playlistId));
    return `Updating stored analysis data of tracks on playlist`;
  }
}
