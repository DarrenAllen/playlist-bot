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
import * as dotenv from 'dotenv';
import { pick } from 'lodash';

dotenv.config();
const { SPOTIFY_ID, SPOTIFY_SECRET } = process.env;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
@Command({
  name: 'artists',
  description: 'Updates stored artists data, use sparingly',
})
export class ArtistCommand {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async getArtistData(artistId) {
    const client = await Client.create({
      token: {
        clientID: SPOTIFY_ID,
        clientSecret: SPOTIFY_SECRET,
      },
    });

    // get the tracks from the playlist
    const artist = await client.artists.get(artistId);

    // const features = await client.tracks.getAudioFeatures(trackId);
    // console.info('anal', artist);
    return artist;
  }

  async archiveArtist() {
    const existingArtists = await this.knex('artists').select('uri');

    const playlistArtists = await this.knex.raw(
      `SELECT distinct value->>'uri' as uri
      FROM   tracks r, json_array_elements(r.track->'track'->'artists') obj`,
    );
    const artistsToProcess = (
      playlistArtists.rows as {
        [key: string]: string;
      }[]
    ).filter(({ uri }) => !existingArtists.map(({ uri }) => uri).includes(uri));

    for (const artist of artistsToProcess.slice(1)) {
      // like spotify:track:3XH68VARiffUSObLtIkp2J => 3XH68VARiffUSObLtIkp2J
      const artistId = artist.uri.split(':').slice(-1)[0];
      let data;
      try {
        data = await this.getArtistData(artistId);
      } catch (error) {
        console.error('ERROR GETTING Artist', error);
        throw new Error(error);
      }

      // console.info('analysis!', track.uri, analysis);
      await this.knex(TABLES.artists).insert({
        ...pick(data, ['uri', 'genres']),
        artist: JSON.stringify(data),
      });

      await sleep(3000);
    }
  }

  @Handler()
  async onArtistCommand(
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<string> {
    // regex to get track ID from spotify link like https://open.spotify.com/track/73tHRPP7skoXscwbLE2VBr?si=1c441263e6474d36
    // const regex = /[^\/][\w]+(?=\?|$)/gm;
    // const id = dto.song.match(regex)[0];
    // const playlistId = GUILDS.find(
    //   (guild) => guild.guildid === args[0].guildId,
    // ).playlistid;
    setImmediate((_) => this.archiveArtist());
    return `Updating stored artists data of tracks on playlist`;
  }
}
