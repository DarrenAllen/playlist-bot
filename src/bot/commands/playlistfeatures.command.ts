import {
  Command,
  EventParams,
  Handler,
  InjectDiscordClient,
  InteractionEvent,
} from '@discord-nestjs/core';
import { ClientEvents, Client as DiscordClient, TextChannel } from 'discord.js';
import { Client } from 'spotify-api.js';
import { InjectKnex, Knex } from 'nestjs-knex';
import { KEYS, USERS, TABLES } from 'src/utils/constants';
import sleep from 'src/utils/sleep';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { PlaylistFeaturesDto } from '../dto/playlistFeatures';
import { UsersService } from 'src/users/users.service';
import { ServersService } from 'src/servers/servers.service';
import * as dotenv from 'dotenv';
dotenv.config();
const { SPOTIFY_ID, SPOTIFY_SECRET } = process.env;
@Command({
  name: 'playlistfeatures',
  description: 'Analyze and save track features of playlist',
})
export class PlaylistFeaturesCommand {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    private readonly userService: UsersService,
    private readonly serverService: ServersService,
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

  // Once a day, archive all features
  async archiveAllFeatures() {}

  async archiveFeatures(playlistid) {
    const tracksToProcess = await this.knex(TABLES.tracks)
      .select('uri')
      .whereNull('features')
      .andWhere({ playlistid });

    for (const track of tracksToProcess) {
      console.info('Starting features of track', track);
      // like spotify:track:3XH68VARiffUSObLtIkp2J => 3XH68VARiffUSObLtIkp2J
      const trackId = track.uri.split(':').slice(-1)[0];
      let features;
      try {
        features = await this.getTrackFeatures(trackId);
      } catch (error) {
        console.error('ERROR GETTING FEATURES', error);
        throw new Error(error);
      }

      // console.info('features!', track.uri, features);
      await this.knex(TABLES.tracks)
        .update({ features: JSON.stringify(features) })
        .where('uri', track.uri);
      console.info('finished analysis, waiting');
      await sleep(3000);
    }
    console.info('Analysis complete');
  }
  async getPlaylistFeatures(playlistid, channelId, userNickName?: string) {
    const rangedOptions = [
      'acousticness',
      'danceability',
      'energy',
      'speechiness',
      'instrumentalness',
      'liveness',
      'valence',
    ];
    setImmediate(async () => {
      let message = '';
      let userURI;
      console.info('checking user', userNickName);
      if (userNickName) {
        const user = await this.userService.getUser({ nickname: userNickName });

        userURI = user.externalid;
      }

      const channel = await this.discordClient.channels.cache.get(channelId);
      for (const field of rangedOptions) {
        message += await this.getRangedResults(field, playlistid, userURI);
      }
      message += await this.getPlaylistKeys(playlistid, userURI);
      message += await this.getPlaylistSignatures(playlistid, userURI);
      await (channel as TextChannel).send(message);
    });
    if (userNickName) {
      return `Stats about additions **${userNickName}** made to the playlist:`;
    }
    return 'Some stats about the playlist incoming!';
  }

  async getPlaylistSignatures(playlistid, userURI?: string) {
    let signatures;
    if (userURI) {
      signatures = await this.knex.raw(
        `SELECT features->>'time_signature' as time_signature, count(*) as count
      from ${TABLES.tracks}
      where playlistId = ?
      and track->'addedBy'->>'uri' = ?
      group by features->>'time_signature'`,
        [playlistid, userURI],
      );
    } else {
      signatures = await this.knex.raw(
        `SELECT features->>'time_signature' as time_signature, count(*) as count
      from ${TABLES.tracks}
      where playlistId = ?
      group by features->>'time_signature'`,
        playlistid,
      );
    }

    let message = '**Most common time signatures**\n';
    const totalCount = signatures.rows.reduce(
      (prev, { count }) => prev + Number(count),
      0,
    );

    signatures.rows
      .sort((b, a) => {
        const countA = Number(a.count);
        const countB = Number(b.count);
        if (countA < countB) {
          return -1;
        }
        if (countA > countB) {
          return 1;
        }

        return 0;
      })
      .forEach(({ time_signature, count }) => {
        const ratio = Math.round((100 * count) / totalCount);
        message += `${time_signature}: ${count} *(${ratio}%)*\n`;
      });

    return message;
  }

  async getRangedResults(field: string, playlistid, userURI?: string) {
    let result;
    if (userURI) {
      result = await this.knex.raw(
        `SELECT features->>'${field}' as ${field}
      from ${TABLES.tracks}
      where playlistId = ?
      and track->'addedBy'->>'uri' = ?`,
        [playlistid, userURI],
      );
    } else {
      result = await this.knex.raw(
        `SELECT features->>'${field}' as ${field}
      from ${TABLES.tracks}
      where playlistId = ?`,
        [playlistid],
      );
    }

    const fieldDisplay = field === 'valence' ? 'brightness' : field;
    let message = `**${fieldDisplay.toUpperCase()}**\n`;

    const typedResult = result.rows as { [key: string]: number }[];
    const totalResults = typedResult.length;

    const data = typedResult.map(({ [field]: fi }) => Number(fi));
    const results = {
      '0% - 25%': 0,
      '25% - 50%': 0,
      '50% - 75%': 0,
      '75% - 100%': 0,
    };
    data.forEach((rez) => {
      if (rez < 0.25) {
        results['0% - 25%'] += 1;
      } else if (rez < 0.5) {
        results['25% - 50%'] += 1;
      } else if (rez < 0.75) {
        results['50% - 75%'] += 1;
      } else {
        results['75% - 100%'] += 1;
      }
    });
    Object.keys(results).forEach((key) => {
      const count = results[key];
      const ratio = Math.round((100 * count) / totalResults);
      message += `${key}: ${count} *(${ratio}%)*\n`;
    });
    return message;
  }

  async getPlaylistKeys(playlistid, userURI?: string) {
    let keys;
    if (userURI) {
      keys = await this.knex.raw(
        `SELECT features->>'key' as key, count(*) as count
      from ${TABLES.tracks}
      where playlistId = ?
      and track->'addedBy'->>'uri' = ?
      group by features->>'key'`,
        [playlistid, userURI],
      );
    } else {
      keys = await this.knex.raw(
        `SELECT features->>'key' as key, count(*) as count
      from ${TABLES.tracks}
      where playlistId = ?
      group by features->>'key'`,
        playlistid,
      );
    }

    let message = '**Most common keys**\n';

    const totalCount = keys.rows.reduce(
      (prev, { count }) => prev + Number(count),
      0,
    );
    keys.rows
      .sort((b, a) => {
        const countA = Number(a.count);
        const countB = Number(b.count);
        if (countA < countB) {
          return -1;
        }
        if (countA > countB) {
          return 1;
        }

        return 0;
      })
      .forEach(({ key, count }) => {
        const ratio = Math.round((100 * count) / totalCount);
        message += `${KEYS[key]}: ${count} *(${ratio}%)*\n`;
      });

    return message;
  }

  @Handler()
  async onPlaylistFeaturesCommand(
    @EventParams() args: ClientEvents['interactionCreate'],
    @InteractionEvent(SlashCommandPipe) dto: PlaylistFeaturesDto,
  ): Promise<string> {
    const server = await this.serverService.getServer(args[0].guildId);

    const playlistid = server.playlistid;

    const channelId = args[0].channelId;
    if (!dto.task) {
      if (dto.user && !Object.values(USERS).includes(dto.user)) {
        return 'User not found...';
      }
      return this.getPlaylistFeatures(playlistid, channelId, dto.user);
    } else {
      setImmediate(async () => {
        await this.archiveFeatures(playlistid);
      });
      return 'Updating stored features data of tracks on playlist';
    }
  }
}
