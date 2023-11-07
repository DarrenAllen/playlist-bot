import { Param } from '@discord-nestjs/core';

export class LyricDto {
  @Param({
    name: 'idea',
    description: 'Whatcha got?',
    required: true,
  })
  idea: string;
}
