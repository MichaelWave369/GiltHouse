export type Drill = {
  prompt: string;
  choices: string[];
  answer: number;
  why: string;
};

export type Station = {
  id: string;
  name: string;
  kicker: string;
  lesson: string;
  need: number;
  drills: Drill[];
};

export const STATIONS: Station[] = [
  {
    id: "shoe",
    name: "The Shoe",
    kicker: "Blackjack",
    need: 5,
    lesson:
      "The dealer stands on every seventeen. Hard 12 hits against a 2 or a 3, and stands against 4, 5, and 6. Hard 13 through 16 stands against 2 through 6 and hits against 7 through ace. Double hard 9 against 3 through 6, hard 10 against 2 through 9, and hard 11 against anything. Soft 18 hits against 9, 10, and ace. Soft 17 doubles against 3 through 6, otherwise hit. Hold a pair of tens.",
    drills: [
      {
        prompt: "Hard 16. Dealer shows a 10.",
        choices: ["Hit", "Stand", "Double"],
        answer: 0,
        why: "A stiff against a ten loses if you stand and the dealer makes a hand. Take the hit.",
      },
      {
        prompt: "Hard 12. Dealer shows a 4.",
        choices: ["Hit", "Stand", "Double"],
        answer: 1,
        why: "A 4 busts often enough. A 12 already beats a bust. Leave it.",
      },
      {
        prompt: "Hard 12. Dealer shows a 2.",
        choices: ["Hit", "Stand", "Double"],
        answer: 0,
        why: "Twelve against a 2 or a 3 is the exception. Hit it.",
      },
      {
        prompt: "Hard 11. Dealer shows a 6.",
        choices: ["Hit", "Stand", "Double"],
        answer: 2,
        why: "Eleven wants exactly one card, and a 6 is a bust card. Double.",
      },
      {
        prompt: "Hard 11. Dealer shows an ace.",
        choices: ["Hit", "Stand", "Double"],
        answer: 2,
        why: "At this shoe the dealer stands on soft 17, and hard 11 still doubles against an ace.",
      },
      {
        prompt: "Soft 18. Dealer shows a 9.",
        choices: ["Hit", "Stand", "Double"],
        answer: 0,
        why: "Soft 18 loses to 9, 10, and ace. A hit cannot bust a soft 18.",
      },
      {
        prompt: "Hard 10. Dealer shows a 9.",
        choices: ["Hit", "Stand", "Double"],
        answer: 2,
        why: "Hard 10 doubles against 2 through 9.",
      },
      {
        prompt: "Hard 13. Dealer shows a 6.",
        choices: ["Hit", "Stand", "Double"],
        answer: 1,
        why: "Thirteen through sixteen stands against 2 through 6.",
      },
    ],
  },
  {
    id: "wheel",
    name: "The Wheel",
    kicker: "Roulette",
    need: 3,
    lesson:
      "One zero. Every standard bet keeps one chip in thirty-seven, about 2.7 percent. Red is not cheaper than a single number. It only swings less. Five reds do not make black due. A martingale raises the stake until the limit or the purse stops the run. It does not change the edge.",
    drills: [
      {
        prompt: "Which bet has the smaller house edge, red or 17?",
        choices: ["Red", "17", "The same edge"],
        answer: 2,
        why: "The percent is the same. Seventeen just pays more because it hits less.",
      },
      {
        prompt: "The wheel has rolled five reds. The next spin is",
        choices: ["Due black", "Still 18 red, 18 black, 1 zero", "A lock for red"],
        answer: 1,
        why: "The wheel has no memory. The last five spins are not a debt.",
      },
      {
        prompt: "A martingale after a loss",
        choices: ["Removes the house edge", "Raises the stake until you cannot", "Is required at this wheel"],
        answer: 1,
        why: "Doubling back only works until the purse or the table says no. The edge is still there.",
      },
    ],
  },
  {
    id: "rail",
    name: "The Rail",
    kicker: "Craps",
    need: 3,
    lesson:
      "Pass wins the come-out on 7 and 11 and loses on 2, 3, and 12. Once a point is set, the odds bet behind the pass line is paid at true odds. That is the best bet on the rail. The field is a one-roll bet with an edge near 5 percent. Any seven is worse than both.",
    drills: [
      {
        prompt: "The point is 6. Which bet is the fair one?",
        choices: ["Odds behind the pass", "The field", "Any seven"],
        answer: 0,
        why: "Odds behind the pass are paid at true odds. The field and any seven are taxed.",
      },
      {
        prompt: "Come-out. Which bet is the worst of these?",
        choices: ["Pass line", "Don't pass", "Any seven"],
        answer: 2,
        why: "Pass and don't pass are close. Any seven is a one-roll bet the house prices badly.",
      },
      {
        prompt: "Come-out, you have the pass line. A 7",
        choices: ["Wins", "Loses", "Sets the point"],
        answer: 0,
        why: "Seven and eleven win the come-out. The point comes later, on 4, 5, 6, 8, 9, or 10.",
      },
    ],
  },
  {
    id: "salon",
    name: "The Salon",
    kicker: "Baccarat",
    need: 3,
    lesson:
      "Banker wins a little more often than player. The house takes five percent and the banker bet is still the cheapest on the layout, near 1.06 percent. Player is near 1.24 percent. The tie pays 8 to 1 and costs about 14 percent. The pit does not play the tie.",
    drills: [
      {
        prompt: "Which bet has the lowest edge?",
        choices: ["Player", "Banker", "Tie"],
        answer: 1,
        why: "Commission and all, banker is still the small number.",
      },
      {
        prompt: "The tie is",
        choices: ["The best price on the layout", "A long shot the house keeps most of", "Required with a banker bet"],
        answer: 1,
        why: "Eight to one does not pay for how rarely the totals match.",
      },
      {
        prompt: "The banker commission is",
        choices: ["Five percent of a winning banker bet", "Five percent of every bet", "Taken only on a tie"],
        answer: 0,
        why: "This house pays banker nineteen to twenty. That is the five percent.",
      },
    ],
  },
  {
    id: "draw",
    name: "The Draw",
    kicker: "Jacks or better",
    need: 3,
    lesson:
      "The machine pays a pair of jacks or higher. Hold a paying pair and drop the kickers. A low pair still beats three random suited cards. Four cards to a flush are worth holding. Two cards to a royal beat a low pair. Do not break jacks or better for a one-card flush draw.",
    drills: [
      {
        prompt: "J♠ J♦ 9♣ 4♥ 2♠. What do you hold?",
        choices: ["The jacks", "Jacks and the nine", "All five"],
        answer: 0,
        why: "A high pair is already paid. Kickers do not help it.",
      },
      {
        prompt: "10♠ 10♥ A♦ 7♣ 3♠. What do you hold?",
        choices: ["The tens", "The ace", "Tens and the ace"],
        answer: 0,
        why: "A low pair is the made hand. An ace kicker is a draw to nothing that pays.",
      },
      {
        prompt: "Q♥ J♥ 9♥ 4♥ 2♣. What do you hold?",
        choices: ["The four hearts", "Queen and jack only", "All five"],
        answer: 0,
        why: "Four to a flush is the hold. The deuce of clubs is in the way.",
      },
    ],
  },
  {
    id: "reels",
    name: "The reels",
    kicker: "Vesper and After Hours",
    need: 3,
    lesson:
      "Neither machine remembers the last spin. A cold run is not a debt the next spin has to pay. The stake changes how much you swing. It does not change the edge. Vesper pays three lines. After Hours pays one line, and the first two reels have to agree.",
    drills: [
      {
        prompt: "Ten spins missed. The next spin is",
        choices: ["Due", "The same odds as the first spin", "A better price"],
        answer: 1,
        why: "The reels draw again. The past is not in the math.",
      },
      {
        prompt: "Raising the stake",
        choices: ["Lowers the house edge", "Wins the same percent on a bigger number", "Forces a jackpot"],
        answer: 1,
        why: "More chips in, more chips out, same percent kept by the house.",
      },
      {
        prompt: "After Hours pays when",
        choices: ["Any two symbols match", "The first two reels match, or all three", "The middle symbol is a gem"],
        answer: 1,
        why: "It is one line. Two of a kind has to be the first two windows.",
      },
    ],
  },
  {
    id: "cage",
    name: "The Cage",
    kicker: "Keno",
    need: 3,
    lesson:
      "Ten numbers come out of forty. Catching all six spots on a six-spot ticket is about one in ten thousand. Two hundred fifty times the stake does not pay for that miss. Smaller tickets miss less often and the house still keeps a slice. Play it for the draw, not for a wage.",
    drills: [
      {
        prompt: "The six-spot jackpot is the right chase because",
        choices: ["It is not. The catch is far rarer than the pay", "It is due after a dry week", "More spots always pay better"],
        answer: 0,
        why: "A 250× ticket against a one-in-ten-thousand catch is a bad price.",
      },
      {
        prompt: "The cage draws",
        choices: ["10 of 40", "20 of 80", "6 of 40"],
        answer: 0,
        why: "This cage is the small board. Ten numbers leave it.",
      },
      {
        prompt: "A sensible cage ticket is",
        choices: ["A small stake you can watch", "The whole purse on six spots", "A system that adds a spot after each miss"],
        answer: 0,
        why: "The edge does not flip because you stayed for another draw.",
      },
    ],
  },
  {
    id: "wire",
    name: "The Wire",
    kicker: "Sports",
    need: 3,
    lesson:
      "−110 means you lay 110 chips to win 100. +150 means you lay 100 to win 150. The number locks when you bet, not when the game ends. If both sides are minus money, the gap is the juice. A push gives the stake back. A final game is closed. The pit cannot pick the winner. It can read the price.",
    drills: [
      {
        prompt: "+150 on 100 chips. If it hits, the profit is",
        choices: ["150", "250", "100"],
        answer: 0,
        why: "Plus money pays that many chips on a 100-chip stake. The stake was already put up.",
      },
      {
        prompt: "The game is already final. You",
        choices: ["Can still bet the closing number", "Cannot bet it", "Get the price from the open"],
        answer: 1,
        why: "The wire closes when the game is final. There is nothing left to price.",
      },
      {
        prompt: "Your spread lands exactly on the number. The ticket",
        choices: ["Loses", "Pays −110", "Pushes and returns the stake"],
        answer: 2,
        why: "A push is a tie with the number. The held chips come back.",
      },
    ],
  },
];
