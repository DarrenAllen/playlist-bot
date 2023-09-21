const { GUILD_ID_WITH_COMMANDS, SERVER_PLAYLIST, SERVER_NAME } = process.env;
exports.seed = async function (knex) {
  const toInsert = [];
  toInsert.push({
    name: SERVER_NAME,
    guildid: GUILD_ID_WITH_COMMANDS,
    playlistid: SERVER_PLAYLIST,
  });

  // Deletes ALL existing entries
  return knex('servers')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('servers').insert(toInsert);
    });
};
