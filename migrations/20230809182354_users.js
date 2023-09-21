exports.up = function (knex) {
  return knex.schema.createTable('users', function (table) {
    table.increments('userid');
    table.string('username');
    table.string('externalid');
    table.string('nickname');
    table.string('serverid');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users');
};
