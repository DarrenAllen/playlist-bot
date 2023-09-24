import { Param } from '@discord-nestjs/core';

export class IdeaDto {
  @Param({
    name: 'idea',
    description: 'Whatcha got?',
    required: true,
  })
  idea: string;
}
