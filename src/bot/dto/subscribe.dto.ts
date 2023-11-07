import { Param } from '@discord-nestjs/core';

export class SubscribeDto {
  @Param({
    name: 'playlist',
    description: 'A spotify link to the playlist you want to follow',
    required: true,
  })
  playlist: string;
}
