import {
  Command,
  EventParams,
  Handler,
  InjectDiscordClient,
} from '@discord-nestjs/core';
import {
  ClientEvents,
  Client as DiscordClient,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { Client } from 'spotify-api.js';
import { InjectKnex, Knex } from 'nestjs-knex';
import { TABLES } from 'src/utils/constants';
import { UsersService } from 'src/users/users.service';
import { PlaylistService } from 'src/playlist/playlist.service';
import * as dotenv from 'dotenv';
import { ServersService } from 'src/servers/servers.service';
dotenv.config();
const { SPOTIFY_ID, SPOTIFY_SECRET } = process.env;
/*
  Other allowed options to potential implement:
  min_acousticness
max_acousticness
target_acousticness
min_danceability
max_danceability
target_danceability
min_duration_ms
max_duration_ms
target_duration_ms
min_energy
max_energy
target_energy
min_instrumentalness
max_instrumentalness
target_instrumentalness
min_key
max_key
target_key
min_liveness
max_liveness
target_liveness
min_loudness
max_loudness
target_loudness
min_mode
max_mode
target_mode
min_popularity
max_popularity
target_popularity
min_speechiness
max_speechiness
target_speechiness
min_tempo
max_tempo
target_tempo
min_time_signature
max_time_signature
target_time_signature
min_valence
max_valence
target_valence
*/
@Command({
  name: 'recommend',
  description: 'Recommend some tracks',
})
export class RecommendationCommand {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    private readonly userService: UsersService,
    private readonly playlistService: PlaylistService,
    private readonly serverService: ServersService,
  ) {}
  async getUserRecommendation() {
    // pick a random user
  }
  async sendToChannel(channelId: string, track: any, seed: any[]) {
    console.info('recommendations!', track, seed);

    const exampleEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(track.name)
      .setURL(track.externalURL.spotify)
      .setDescription(`**${track.artists[0].name} •** *${track.album.name}*`)
      .setThumbnail(track.album.images[0].url);

    const channel = await this.discordClient.channels.cache.get(channelId);

    await (channel as TextChannel).send({
      embeds: [exampleEmbed],
    });
  }
  async getPlaylistRecommendations(
    playlistid,
    channelId: string,
    serverid: number,
  ) {
    const tracks = (
      await this.knex.raw(
        `SELECT uri, trackname, track->'addedBy'->>'uri' as addedby 
      FROM ${TABLES.tracks}
      where playlistid = ?`,
        [playlistid],
      )
    ).rows;
    console.info('TRACKS', tracks.length);
    // get 5 random tracks
    // Shuffle array
    const users = await this.userService.getUsers(serverid);
    console.info('USers!', users);

    const playlistArtists = (
      await this.playlistService.getPlaylistArtists(playlistid)
    ).map(({ uri }) => uri);
    console.info('playlistArtists', playlistArtists.length);
    const selectedTracks = [];
    if (users.length > 5) {
      throw new Error('Too many members of server');
    }

    users.forEach(({ externalid }) => {
      const filteredTracks = tracks.filter(
        ({ addedby }) => addedby == externalid,
      );
      console.info('filtereed', filteredTracks[0]);
      const shuffled = filteredTracks.sort(() => 0.5 - Math.random());
      // If there are only two users, use two tracks, otherwise one
      if (users.length === 2) {
        const currentTracks = shuffled.slice(0, 2);
        console.info('currentTracks', currentTracks);
        selectedTracks.push(currentTracks[0]);
        selectedTracks.push(currentTracks[1]);
      } else {
        const selectedTrack = shuffled.slice(0, 1)[0];

        selectedTracks.push(selectedTrack);
      }
    });
    console.info('SELECTED', selectedTracks);
    const seed_tracks = selectedTracks
      .map((track) => track.uri.split(':').slice(-1)[0])
      .join(',');
    console.info('seedtracks!', seed_tracks);
    // Let's not get live songs...
    const max_liveness = 0.5;
    // let's not get extra short or long songs
    const min_duration_ms = 133355;
    const max_duration_ms = 797115;
    // keep the result set small

    const client = await Client.create({
      token: {
        clientID: SPOTIFY_ID,
        clientSecret: SPOTIFY_SECRET,
      },
    });
    const recommendations = await client.browse.getRecommendations({
      seed_tracks,
      max_liveness,
      min_duration_ms,
      max_duration_ms,
      limit: 50,
      seed_artists: '',
      seed_genres: '',
    });
    // make sure the recommended track doesn't have any already added artists
    const recommendedTracks = recommendations.tracks.filter(({ artists }) => {
      // console.info('checking!', artists);
      // console.info('against');
      return !artists.find(({ uri }) => playlistArtists.includes(uri));
    });

    await this.sendToChannel(channelId, recommendedTracks[0], selectedTracks);
  }
  async saveToRecPlaylist(trackid, recplaylistid) {
    const client = await Client.create({
      token: {
        clientID: SPOTIFY_ID,
        clientSecret: SPOTIFY_SECRET,
      },
    });
    // save the track to the playlist for this server
    await client.playlists.addItems(recplaylistid, [trackid]);
  }
  @Handler()
  async onRecommendationCommand(
    @EventParams() args: ClientEvents['interactionCreate'],
  ): Promise<string> {
    const messageTitle = `Recommendations based on one random track per band member from the playlist`;
    const server = await this.serverService.getServer(args[0].guildId);

    const playlistId = server.playlistid;
    const serverid = server.serverid;

    const channelId = args[0].channelId;
    setImmediate(async () => {
      await this.getPlaylistRecommendations(playlistId, channelId, serverid);
    });

    return messageTitle;
  }
}
