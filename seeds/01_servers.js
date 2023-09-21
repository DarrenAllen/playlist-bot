const {
  GUILD_ID_WITH_COMMANDS,
  SERVER_PLAYLIST,
  SERVER_NAME,
  H_GUILD_ID,
  H_SERVER_PLAYLIST,
  H_SERVER_NAME,
} = process.env;
exports.seed = async function (knex) {
  const toInsert = [];
  toInsert.push({
    name: SERVER_NAME,
    guildid: GUILD_ID_WITH_COMMANDS,
    playlistid: SERVER_PLAYLIST,
  });
  toInsert.push({
    name: H_SERVER_NAME,
    guildid: H_GUILD_ID,
    playlistid: H_SERVER_PLAYLIST,
  });
  // Deletes ALL existing entries
  return knex('servers')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('servers').insert(toInsert);
    });
};
