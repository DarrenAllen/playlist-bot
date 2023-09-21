import { SlashCommandPipe } from '@discord-nestjs/common';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  Command,
  EventParams,
  Handler,
  InteractionEvent,
  InjectDiscordClient,
} from '@discord-nestjs/core';
import { ClientEvents, Client as DiscordClient } from 'discord.js';
import { Client } from 'spotify-api.js';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AnalysisDto } from '../dto/analysis';
import { omit } from 'lodash';
import { KEYS } from 'src/utils/constants';
import * as dotenv from 'dotenv';
dotenv.config();

const { SPOTIFY_ID, SPOTIFY_SECRET } = process.env;
@Command({
  name: 'features',
  description: 'Analyze track features in spotify',
})
export class FeaturesCommand {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async getTrackFeatures(trackId) {
    const client = await Client.create({
      token: {
        clientID: SPOTIFY_ID,
        clientSecret: SPOTIFY_SECRET,
      },
    });

    const features = await client.tracks.getAudioFeatures(trackId);

    return features;
  }

  @Handler()
  async onFeaturesCommand(
    @InteractionEvent(SlashCommandPipe) dto: AnalysisDto,
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<string> {
    const regex = /[^\/][\w]+(?=\?|$)/gm;
    const id = dto.song.match(regex)[0];
    function objToString(obj) {
      return Object.keys(obj).reduce((prev, cur) => {
        return prev + `${cur}: ${obj[cur]}\n`;
      }, '');
    }
    const analysis = await this.getTrackFeatures(id);
    const keyMap = KEYS;
    const rez = Object.keys(
      omit(analysis, [
        'id',
        'type',
        'uri',
        'track_href',
        'analysis_url',
        'duration_ms',
        'meta',
        'bars',
        'beats',
        'track',
        'tatums',
        'segments',
      ]),
    ).reduce((prev, cur) => {
      let display = analysis[cur];

      switch (cur) {
        case 'mode':
          if (display == 1) {
            display = 'Major key';
          }
          display = 'Minor key';
          break;
        case 'key':
          display = keyMap[Number(display)];
          break;
        case 'sections':
          display = display.map(
            (item, index) => `Section ${index + 1}:\n${objToString(item)}\n`,
          );
          break;
        default:
          break;
      }
      return (prev += `${cur}: ${display}\n`);
    }, `For track: ${dto.song}\n`);
    return rez;
  }
}
