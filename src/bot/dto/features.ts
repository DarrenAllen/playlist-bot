import { Param } from '@discord-nestjs/core';

export class FeaturesDto {
  @Param({
    name: 'song',
    description: 'URL of song from Spotify',
    required: true,
  })
  song: string;
}
