exports.up = function (knex) {
  return knex.schema.createTable('tracks', function (table) {
    table.increments('trackid');
    table.string('trackname');
    table.json('track');
    table.string('playlistid');
    table.string('uri');
    table.json('analysis');
    table.json('features');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('tracks');
};
