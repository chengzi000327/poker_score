function sum(list) {
  return list.reduce((acc, cur) => acc + cur, 0);
}

function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

function fromCents(cents) {
  return cents / 100;
}

function buildTransfers(money, players) {
  const debtors = [];
  const creditors = [];

  money.forEach((value, idx) => {
    const cents = toCents(value);
    if (cents < 0) {
      debtors.push({ idx, amount: -cents });
    } else if (cents > 0) {
      creditors.push({ idx, amount: cents });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0) {
      transfers.push({
        fromIndex: debtors[i].idx,
        toIndex: creditors[j].idx,
        fromName: players ? players[debtors[i].idx] : `玩家${debtors[i].idx + 1}`,
        toName: players ? players[creditors[j].idx] : `玩家${creditors[j].idx + 1}`,
        amount: fromCents(pay),
      });
    }

    debtors[i].amount -= pay;
    creditors[j].amount -= pay;

    if (debtors[i].amount === 0) {
      i += 1;
    }
    if (creditors[j].amount === 0) {
      j += 1;
    }
  }

  return transfers;
}

function calculateRound(params) {
  const {
    jiang,
    burn,
    chipValue,
    teamA,
    loseSide,
    loseLevel,
    players,
  } = params;

  if (!Array.isArray(jiang) || jiang.length !== 4) {
    throw new Error("jiang 必须是长度为 4 的数组");
  }
  if (!Array.isArray(burn) || burn.length !== 4) {
    throw new Error("burn 必须是长度为 4 的数组");
  }
  if (!Array.isArray(teamA) || teamA.length !== 2) {
    throw new Error("teamA 必须是长度为 2 的数组");
  }
  if (teamA[0] === teamA[1]) {
    throw new Error("teamA 不能重复选择同一位玩家");
  }
  if (loseSide !== "A" && loseSide !== "B") {
    throw new Error("loseSide 只能是 A 或 B");
  }
  if (loseLevel !== 1 && loseLevel !== 2) {
    throw new Error("loseLevel 只能是 1 或 2");
  }

  const teamASet = new Set(teamA);
  const teamB = [0, 1, 2, 3].filter((idx) => !teamASet.has(idx));
  const loseSet = loseSide === "A" ? teamASet : new Set(teamB);

  const awardNet = jiang.map((v, i) => 3 * v - (sum(jiang) - v));
  const burnNet = burn.map((v, i) => -3 * v + (sum(burn) - v));
  const teamNet = [0, 1, 2, 3].map((idx) => (
    loseSet.has(idx) ? -2 * loseLevel : 2 * loseLevel
  ));

  const chips = [0, 1, 2, 3].map((idx) => awardNet[idx] + burnNet[idx] + teamNet[idx]);
  const money = chips.map((chip) => chip * chipValue);
  const transfers = buildTransfers(money, players);

  return {
    awardNet,
    burnNet,
    teamNet,
    chips,
    money,
    transfers,
    chipTotalCheck: sum(chips),
    moneyTotalCheck: sum(money),
  };
}

module.exports = {
  calculateRound,
  buildTransfers,
};
