import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { PlayCommand } from './commands/play.command';
import { AnalysisCommand } from './commands/analysis.command';
import { FeaturesCommand } from './commands/features.command';
import { PlaylistFeaturesCommand } from './commands/playlistfeatures.command';
import { UsersService } from 'src/users/users.service';
import { RecommendationCommand } from './commands/recommendation.command';
import { PlaylistService } from 'src/playlist/playlist.service';
import { ServersService } from 'src/servers/servers.service';
import { ArtistCommand } from './commands/artists.command';

@Module({
  imports: [DiscordModule.forFeature()],
  providers: [
    PlayCommand,
    AnalysisCommand,
    FeaturesCommand,
    PlaylistFeaturesCommand,
    UsersService,
    RecommendationCommand,
    PlaylistService,
    ServersService,
    ArtistCommand,
  ],
})
export class BotModule {}
