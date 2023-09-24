exports.up = async function (knex) {
  await knex.schema.alterTable('users', function (table) {
    table.string('discordid');
  });
  return knex.schema.createTable('ideas', function (table) {
    table.increments('ideaid');
    table.string('message');
    table.json('context');
    table.integer('serverid').references('servers.serverid');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', function (table) {
    table.dropColumn('discordid');
  });
  return knex.schema.dropTable('ideas');
};
