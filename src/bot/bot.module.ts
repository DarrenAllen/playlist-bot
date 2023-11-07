import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { RecentCommand } from './commands/recent.command';
import { AnalysisCommand } from './commands/analysis.command';
import { FeaturesCommand } from './commands/features.command';
import { PlaylistFeaturesCommand } from './commands/playlistfeatures.command';
import { UsersService } from 'src/users/users.service';
import { RecommendationCommand } from './commands/recommendation.command';
import { PlaylistService } from 'src/playlist/playlist.service';
import { ServersService } from 'src/servers/servers.service';
import { LyricsCommand } from './commands/lyrics.command';
import { SubscriptionCommand } from './commands/subscriptions.command';
import { ContextModule } from 'src/context/context.module';
import { ArtistsService } from 'src/artists/artists.service';
@Module({
  imports: [DiscordModule.forFeature(), ContextModule],
  providers: [
    RecentCommand,
    AnalysisCommand,
    FeaturesCommand,
    PlaylistFeaturesCommand,
    UsersService,
    RecommendationCommand,
    PlaylistService,
    ServersService,
    LyricsCommand,
    SubscriptionCommand,
    ArtistsService,
  ],
})
export class BotModule {}
