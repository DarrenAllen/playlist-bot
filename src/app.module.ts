import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscordModule } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';
import { BotModule } from './bot/bot.module';
import { KnexModule } from 'nestjs-knex';
import { UsersService } from './users/users.service';
import { PlaylistService } from './playlist/playlist.service';
import { ServersService } from './servers/servers.service';
import * as dotenv from 'dotenv';
import { ScheduleModule } from '@nestjs/schedule';

dotenv.config();
const { DB_PORT, DB_PASSWORD, DB_NAME, DB_USER, DB_HOST } = process.env;

@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    KnexModule.forRoot({
      config: {
        client: 'pg',
        useNullAsDefault: true,
        connection: {
          host: DB_HOST,
          user: DB_USER,
          port: parseInt(DB_PORT),
          password: DB_PASSWORD,
          database: DB_NAME,
        },
      },
    }),
    ConfigModule.forRoot(),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get('DISCORD_TOKEN'),
        discordClientOptions: {
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
          ],
        },
        // registerCommandOptions: [
        //   {
        //     forGuild: configService.get('GUILD_ID_WITH_COMMANDS'),
        //     removeCommandsBefore: true,
        //   },
        // ],
        failOnLogin: true,
      }),
      inject: [ConfigService],
    }),
    BotModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, UsersService, PlaylistService, ServersService],
})
export class AppModule {}
