import { Param } from '@discord-nestjs/core';

export class AnalysisDto {
  @Param({
    name: 'song',
    description: 'URL of song from Spotify',
    required: true,
  })
  song: string;
}
