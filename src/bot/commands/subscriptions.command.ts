import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  Command,
  EventParams,
  Handler,
  InjectDiscordClient,
  InteractionEvent,
} from '@discord-nestjs/core';
import {
  ClientEvents,
  AttachmentBuilder,
  EmbedBuilder,
  TextChannel,
  Client as DiscordClient,
} from 'discord.js';
import { Client } from 'spotify-api.js';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import sleep from 'src/utils/sleep';
import { TABLES } from 'src/utils/constants';
import { UsersService } from 'src/users/users.service';
import * as dotenv from 'dotenv';
import { ServersService } from 'src/servers/servers.service';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Logger, Injectable } from '@nestjs/common';
import { ContextService } from 'src/context/context.service';
import { SubscribeDto } from '../dto/subscribe.dto';
import { PlaylistService } from 'src/playlist/playlist.service';
dotenv.config();
const { SPOTIFY_ID, SPOTIFY_SECRET } = process.env;

@Command({
  name: 'subscribe',
  description: 'Subscribe to a playlist',
})
export class SubscriptionCommand {
  private readonly logger = new Logger(SubscriptionCommand.name);
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private userService: UsersService,
    private readonly serverService: ServersService,
    private readonly contextService: ContextService,
    private readonly playlistService: PlaylistService,
  ) {}
  async getAllPlaylistTracks(playlistid) {
    let offset = 0;
    let complete = false;
    const totalTracks = [];
    while (!complete) {
      const client = await Client.create({
        token: {
          clientID: SPOTIFY_ID,
          clientSecret: SPOTIFY_SECRET,
        },
      });
      const tracks = await client.playlists.getTracks(playlistid, {
        offset,
      });
      totalTracks.push(...tracks);
      // If we got all tracks, we're done!
      if (tracks && tracks.length === 100) {
        offset += 100;
        await sleep(1000);
      } else {
        complete = true;
      }
    }
    return totalTracks;
  }
  async getRecentAdditions(playlists: [string]) {
    //  maximum of 20 playlists
    if (playlists.length > 20) {
      this.logger.error('Too many playlists!');
      return;
    }
    // pick even division of songs to create 10 track playlist
    const songsToFetch = Math.floor(20 / playlists.length);
    for (const playlist in playlists) {
      // pick songsToFetch most recent tracks from the playlist
    }
  }
  // If a user doesn't have a subscription playlist, create one and return its id
  async provisionSubscription(userid: number): Promise<number> {
    return 1;
  }
  // when subscribing to a new playlist
  async addPlaylistToSubscription(userid: number, playlist: string) {
    // make sure there are less than 20 playlists currently in user's subscriptions
    // add the playlist to the user's subscription
  }

  // handle request to subscribe to a playlist
  async subscribe(playlist: string) {}
  @Handler()
  async onSubscriptionCommand(
    @InteractionEvent(SlashCommandPipe) dto: SubscribeDto,
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<string> {
    const message = "You've been added to it!!";

    const channelId = args[0].channelId;
    const { server, user } = await this.contextService.getContext(args);
    console.info(dto);
    const playlistId = server.playlistid;
    const serverid = server.serverid;
    console.info('what about the playlistId??');
    const playlistid = this.playlistService.getPlaylistIdFromLink(dto.playlist);
    setImmediate(async () => {
      // const newTracks = await this.getNewPlaylistTracks(playlistId);
    });

    return message;
  }
}
