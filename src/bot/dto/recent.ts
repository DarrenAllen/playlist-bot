import { Param, ParamType } from '@discord-nestjs/core';

export class RecentDto {
  @Param({
    name: 'silent',
    description: 'When set, will skip notifications',
    required: false,
    type: ParamType.BOOLEAN,
  })
  silent: boolean;
}
