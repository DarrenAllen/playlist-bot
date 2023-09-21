exports.up = function (knex) {
  return knex.schema.createTable('servers', function (table) {
    table.increments('serverid');
    table.string('name');
    table.string('guildid');
    table.string('playlistid');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('servers');
};
