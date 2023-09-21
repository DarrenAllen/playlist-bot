const { NANI, AX, DAZ, BLACKSUWAN, BERTHOLOMEW } = process.env;
exports.seed = async function (knex) {
  const toInsert = [];

  toInsert.push({
    username: 'AX',
    externalid: AX,
    nickname: 'ax',
    serverid: 1,
  });
  toInsert.push({
    username: 'daz',
    externalid: DAZ,
    nickname: 'daz',
    serverid: 1,
  });
  toInsert.push({
    username: 'Nani',
    externalid: NANI,
    nickname: 'manny',
    serverid: 1,
  });
  toInsert.push({
    username: 'blacksuwan',
    externalid: BLACKSUWAN,
    nickname: 'suwan',
    serverid: 1,
  });
  toInsert.push({
    username: 'Bertholomew',
    externalid: BERTHOLOMEW,
    nickname: 'bert',
    serverid: 1,
  });

  // Deletes ALL existing entries
  return knex('users')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert(toInsert);
    });
};
