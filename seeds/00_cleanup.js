exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('artists').del();
  await knex('tracks').del();
  await knex('ideas').del();
};
