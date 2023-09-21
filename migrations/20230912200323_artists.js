exports.up = function (knex) {
  return knex.schema.createTable('artists', function (table) {
    table.increments('id').primary();
    table.json('artist').notNullable();
    table.string('uri').notNullable().unique();
    table.specificType('genres', 'text[]'); // Array of genre strings.
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('artists');
};
