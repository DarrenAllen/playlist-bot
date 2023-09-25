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
import { RecentDto } from '../dto/recent';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Logger, Injectable } from '@nestjs/common';

dotenv.config();
const { SPOTIFY_ID, SPOTIFY_SECRET } = process.env;

@Command({
  name: 'recent',
  description: 'Lists recent additions ot the playlist',
})
export class RecentCommand {
  private readonly logger = new Logger(RecentCommand.name);
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private userService: UsersService,
    private readonly serverService: ServersService,
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
  async getNewPlaylistTracks(playlistid) {
    // get the existing tracks from the DB
    const previousTracks = await this.knex(TABLES.tracks)
      .select()
      .where({ playlistid });

    // const totalTracks = await this.getAllPlaylistTracks(playlistId);
    // get the tracks from the playlist
    const tracks = await this.getAllPlaylistTracks(playlistid);

    const newlyAddedTracks = tracks.filter(
      ({ track: { uri: newURI } }) =>
        !previousTracks.map(({ uri }) => uri).includes(newURI),
    );

    if (newlyAddedTracks.length === 0) {
      return [];
    }
    await this.knex(TABLES.tracks).insert(
      newlyAddedTracks.map((track) => ({
        track: JSON.stringify(track),
        uri: track.track.uri,
        trackname: track.track.name,
        playlistid,
      })),
    );
    return newlyAddedTracks;
  }

  async sendToChannel(tracks = [], channelId, serverid) {
    if (tracks.length === 0) {
      this.logger.log("Nothing new's been added to the playlist");
      // const channel = await this.discordClient.channels.cache.get(channelId);
      // await (channel as TextChannel).send(
      //   "Nothing new's been added to the playlist...",
      // );
    }
    const users = await this.userService.getUsers(serverid);

    for (const track of tracks) {
      await sleep(2000);
      this.logger.log(`Track found ${track.addedBy.uri}`);
      this.logger.log(
        `Checking users ${users.map(({ externalid }) => externalid)}`,
      );
      const addedBy = users.find(
        (user) => user.externalid == track.addedBy.uri,
      );
      let fileName = '';
      switch (addedBy?.nickname) {
        case 'ax':
          fileName = 'ax.webp';
          break;
        case 'bert':
          fileName = 'bert.png';
          break;
        case 'manny':
          fileName = 'manny.webp';
          break;
        case 'suwan':
          fileName = 'suwan.png';
          break;
        case 'harold':
          fileName = 'harold.webp';
          break;
        default:
          fileName = 'daz.webp';
          break;
      }
      const file = new AttachmentBuilder(`./assets/${fileName}`);
      // from here, send a bunch of messages to the channel!
      // for each track added, wait 3 seconds and send an entry for each
      const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(track.track.name)
        .setURL(track.track.externalURL.spotify)
        .setAuthor({
          name: addedBy.username || 'Unknown',
          iconURL: `attachment://${fileName}`,
        })
        .setDescription(
          `**${track.track.artists[0].name} •** *${track.track.album.name}*`,
        )

        .setThumbnail(track.track.album.images[0].url)
        .setFooter({
          text: `Added on ${new Date(track.addedAt).toLocaleDateString()}`,
        });
      // return;
      const channel = await this.discordClient.channels.cache.get(channelId);
      this.logger.log(`Sending message to channel ${channelId}`);
      await (channel as TextChannel).send({
        embeds: [exampleEmbed],
        files: [file],
      });
    }
  }
  // every day, check previous day's entries
  @Cron('*/10 * * * *')
  async intervalSync() {
    this.logger.log('Starting internal recents sync');
    // for each server
    const servers = await this.serverService.getServers();
    for (const server of servers) {
      const { playlistid, updateschannel, serverid } = server;
      if (updateschannel) {
        try {
          this.logger.log(`For Server ${serverid}`);
          const newTracks = await this.getNewPlaylistTracks(playlistid);
          this.logger.log(`New Tracks: ${newTracks.length}`);
          this.sendToChannel(newTracks, updateschannel, serverid);
          await sleep(60000);
        } catch (err) {
          this.logger.error('Failed sync:');
          this.logger.error(err);
        }
      }
    }
  }

  @Handler()
  async onRecentCommand(
    @InteractionEvent(SlashCommandPipe) dto: RecentDto,
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<string> {
    const message = "Let's see what's been added to the playlist recently!";

    const channelId = args[0].channelId;
    const server = await this.serverService.getServer(args[0].guildId);

    const playlistId = server.playlistid;
    const serverid = server.serverid;
    setImmediate(async () => {
      const newTracks = await this.getNewPlaylistTracks(playlistId);
      if (!dto.silent) {
        this.sendToChannel(newTracks, channelId, serverid);
      }
    });

    return message;
  }
}
