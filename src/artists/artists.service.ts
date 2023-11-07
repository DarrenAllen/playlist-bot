import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as dotenv from 'dotenv';
import { TABLES } from 'src/utils/constants';
import { pick } from 'lodash';
import { Client } from 'spotify-api.js';

dotenv.config();
const { SPOTIFY_ID, SPOTIFY_SECRET } = process.env;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
@Injectable()
export class ArtistsService {
  private readonly logger = new Logger(ArtistsService.name);
  constructor(
    @InjectKnex() private readonly knex: Knex,
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

  async archiveArtists() {
    this.logger.log('Archiving artist data');
    const existingArtists = await this.knex('artists').select('uri');

    const playlistArtists = await this.knex.raw(
      `SELECT distinct value->>'uri' as uri
      FROM   tracks r, json_array_elements(r.track->'track'->'artists') obj`,
    );
    this.logger.log(playlistArtists);
    const artistsToProcess = (
      playlistArtists.rows as {
        [key: string]: string;
      }[]
    ).filter(({ uri }) => !existingArtists.map(({ uri }) => uri).includes(uri));

    console.info(artistsToProcess.slice(1));
    for (const artist of artistsToProcess) {
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
}
