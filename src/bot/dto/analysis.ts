import { Param } from '@discord-nestjs/core';
import { Transform } from 'class-transformer';

export class AnalysisDto {
  @Param({
    name: 'song',
    description: 'URL of song from Spotify',
    required: true,
  })
  song: string;
}
