import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

//UI Elements
const CardBackImage = () => (
  <img alt="back card" src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
      alt="card"
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  const playerHand = cardDeck.slice(cardDeck.length - 2, cardDeck.length);
  const dealerHand = cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2);
  return {
    playerHand,
    dealerHand,
    playerScore: calculateHandScore(playerHand),
    dealerScore: calculateHandScore(dealerHand),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn"
  };
};

//Scoring
const calculateHandScore = (hand: Hand): number => {
  let score = 0;
  let aceCount = 0;

  // Iterate through each card in the hand
  for (const card of hand) {
    // For numbered cards, add their respective values
    if (card.rank >= CardRank.Two && card.rank <= CardRank.Nine) {
      score += parseInt(card.rank);
    }
    // For 10, Jack, Queen, King, add 10 points
    else if (
      card.rank === CardRank.Ten ||
      card.rank === CardRank.Jack ||
      card.rank === CardRank.Queen ||
      card.rank === CardRank.King
    ) {
      score += 10;
    }
    // For Ace, increment the ace count
    else if (card.rank === CardRank.Ace) {
      aceCount++;
      score++;
    }
  }
  

  // Now, handle Aces
  for (let i = 0; i < aceCount; i++) {
    // If adding remaining 10 doesn't bust, add 10
    if (score + 10 <= 21) {
      score += 10;
    }
  }

  return score;
};

const determineGameResult = (state: GameState): GameResult => {
  const playerScore = calculateHandScore(state.playerHand);
  const dealerScore = calculateHandScore(state.dealerHand);

  // Check for busts
  if (playerScore > 21) {
    return "dealer_win";
  }
  if (dealerScore > 21) {
    return "player_win";
  }

  // Check for blackjack
  const playerHasBlackjack = playerScore === 21 && state.playerHand.length === 2;
  const dealerHasBlackjack = dealerScore === 21 && state.dealerHand.length === 2;
  if (playerHasBlackjack && !dealerHasBlackjack) {
    return "player_win";
  }
  if (dealerHasBlackjack && !playerHasBlackjack) {
    return "dealer_win";
  }

  // Compare scores
  if (playerScore > dealerScore) {
    return "player_win";
  }
  if (playerScore < dealerScore) {
    return "dealer_win";
  }

  // If scores are equal, it's a draw
  return "draw";
};

//Player Actions
const playerStands = (state: GameState): GameState => {
  let updatedState: GameState = {
    ...state,
    turn: "dealer_turn",
  };
  
  while (calculateHandScore(updatedState.dealerHand) <= 16) {
    const { card, remaining } = takeCard(updatedState.cardDeck);
    updatedState.cardDeck = remaining;
    updatedState.dealerHand = [...updatedState.dealerHand, card];
    updatedState.dealerScore = calculateHandScore(updatedState.dealerHand);
  }
  
  return updatedState;
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  const updatedPlayerhand = [...state.playerHand, card];
  return {
    ...state,
    cardDeck: remaining,
    playerHand: updatedPlayerhand,
    playerScore: calculateHandScore(updatedPlayerhand)
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn" || state.playerScore >= 21}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn" || state.playerScore >= 21}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {state.playerScore}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {state.dealerScore}</p>
        </div>
      )}
      { (state.playerScore >= 21 || (state.turn === "dealer_turn" &&
      determineGameResult(state) !== "no_result")) ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
