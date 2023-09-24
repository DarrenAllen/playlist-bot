const { NANI, AX, DAZ, BLACKSUWAN, BERTHOLOMEW, HAROLD } = process.env;
exports.seed = async function (knex) {
  const toInsert = [];

  toInsert.push({
    username: 'AX',
    externalid: AX,
    nickname: 'ax',
    serverid: 1,
    discordid: '884592779299262564',
  });
  toInsert.push({
    username: 'daz',
    externalid: DAZ,
    nickname: 'daz',
    serverid: 1,
    discordid: '619879505334370307',
  });
  toInsert.push({
    username: 'Nani',
    externalid: NANI,
    nickname: 'manny',
    serverid: 1,
    discordid: '842154563913777153',
  });
  toInsert.push({
    username: 'blacksuwan',
    externalid: BLACKSUWAN,
    nickname: 'suwan',
    serverid: 1,
    discordid: '478398737698390019',
  });
  toInsert.push({
    username: 'Bertholomew',
    externalid: BERTHOLOMEW,
    nickname: 'bert',
    serverid: 1,
    discordid: '957013176610861146',
  });
  toInsert.push({
    username: 'Harold',
    externalid: HAROLD,
    nickname: 'harold',
    serverid: 2,
    discordid: '347148622586052611',
  });

  // Deletes ALL existing entries
  return knex('users')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert(toInsert);
    });
};
