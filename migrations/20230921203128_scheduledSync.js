exports.up = function (knex) {
  return knex.schema.alterTable('servers', function (table) {
    table.string('updateschannel');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('servers', function (table) {
    table.dropColumn('updateschannel');
  });
};
