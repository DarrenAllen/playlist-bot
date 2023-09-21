import { Param } from '@discord-nestjs/core';

export class PlaylistFeaturesDto {
  @Param({
    name: 'task',
    description: 'Task to complete on playlist features',
    required: false,
  })
  task: string;
  @Param({
    name: 'user',
    description: 'Filter by user ex: daz, ax, bert, manny, suwan',
    required: false,
  })
  user: string;
}
