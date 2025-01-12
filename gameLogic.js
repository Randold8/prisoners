// gameLogic.js

/**
 * Returns Prisoner’s Dilemma payoffs based on two choices.
 */
function getOutcome(choice1, choice2) {
  if (choice1 === 'silent' && choice2 === 'silent') {
    return { player1: 1, player2: 1 };
  }
  if (choice1 === 'tattle' && choice2 === 'tattle') {
    return { player1: 2, player2: 2 };
  }
  if (choice1 === 'tattle' && choice2 === 'silent') {
    return { player1: 0, player2: 3 };
  }
  if (choice1 === 'silent' && choice2 === 'tattle') {
    return { player1: 3, player2: 0 };
  }
  // Default fallback (shouldn’t happen if choices are always valid)
  return { player1: 0, player2: 0 };
}

/**
 * Returns a short personalized message for a given prison term (years).
 */
function getPersonalizedMessage(years) {
  switch (years) {
    case 0:
      return "You're free! Congratulations—but at what moral cost?";
    case 1:
      return "One year — could have been worse. Your trust wasn't misplaced!";
    case 2:
      return "Two years — both tattled, both lost. Snitches get stitches!";
    case 3:
      return "Three years — sorry! Maybe you relied on your partner too much...";
    default:
      return "";
  }
}

/**
 * Records a player's choice, checks if both have chosen,
 * and if so, computes the outcome and messages.
 */
function onChoice(room, playerId, choice) {
  room.choices[playerId] = choice;

  // If two unique players have chosen, compute the outcome
  const playerIds = Object.keys(room.choices);
  if (playerIds.length === 2) {
    const [p1, p2] = playerIds;
    const outcome = getOutcome(room.choices[p1], room.choices[p2]);
    const messages = {
      player1: getPersonalizedMessage(outcome.player1),
      player2: getPersonalizedMessage(outcome.player2)
    };
    return { p1, p2, outcome, messages };
  }

  return null; // Not ready yet
}

module.exports = {
  onChoice,
  getOutcome
};
