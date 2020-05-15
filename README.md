# Ludo

This app was initially generated using `rails new` with Ruby version 2.7.1p83
and Rails version 6.0.3.


## Design

This section describes the overall design of the game that we're going for.
This does not necessarily mean that we'll aim for this right away, but that's
the goal.

### Game Model

A game is essentially an instance of Ludo that someone started, and this
game will have multiple agents. All agents, in a fully authorized game,
may have audio enabled (NOTE: we may allow video as well, but for now
that seems like too much).

Now, a game will have 3 agents: the game host, the players, and viewers.

The **game host** has full priviledge to the game. They may
allow/restrict/disallow viewers at the start of the game, and for all
viewers (collectively), they may enable or disable audio. The host may
also enable which variants of the game is played (to be discussed in the
Game Rules section).

The **game players** are able to play the games. Their audio can only be
enabled/disabled by themselves, but they have that priviledge at all times.

The **game viewers** only watch the game. Viewers may watch any public game
or a game for which they have a restricted access to (i.e., through password).

All games are in 3 states:
1. WAITING
   - While a game is in this state, new players may join in or leave the game.
   - At most 4 players may join, and at least 2 players must join.
   - Viewers may also join as viewers.
2. ONGOING
   - Games in this state can be viewed.
   - Viewers may join any ongoing game.
3. COMPLETED
   - A history of the game can be viewed by anyone.

### Game Rules

These rules are a bit inspired from the [mastersofgame](https://www.mastersofgames.com/rules/ludo-rules-instructions-guide.htm)
website.

Players take turns in a clockwise order. At the start of the game,
we have a sequence of rolls. We roll with 2 dices in this game.
The player with the highest roll goes first.

Then, for the next sets of rolls, let's assume a player rolls [`X`, `Y`]. Then,
the following actions can be taken:
- If any of `X` or `Y` is a 6, the player must roll that one again. They
  will continue to roll until no more 6's are rolled.
  - In a variant of this, we may allow continued rolling only if *both*
    `X` and `Y` are 6's.

  After that, let's assume the player has collected move collection
  {`X_1`, ..., `X_n`}.
- If a piece is out of the home, it may move that piece forward for any
  of the `X_i`. A player may choose to move multiple pieces for each of the
  `X_i`s.
  - If a player lands on their piece, then they are doubled in that square.
  - If instead a player lands on another player's piece, they capture them.
    - In one variant, captures go to the capturer's home, from which they
      must be removed with a 6 into the home and then again with a 6 to exit
      the home.
    - In another variant, a player simply returns home to start over.
  - In another variant (perhaps a harder one), if a piece is close to the
    graduation lane, the piece must land on the 0, then 1, then 2, etc. For
    each 1, the player must roll a `1`. For 2, they must roll a `2`, etc.
  - In other variants, we let the player just move up and graduate.
- If a piece is captured, the player may bring them home using one of the 6
  they have (if this variant is applied).
- With a 6, a player may bring someone out to start the ride.
- Also with a 6, a player may graduate a piece in case that piece is at the
  end of the graduation line.

A player wins if all of its pieces graduate.

**NOTE:** In other variants of the game, we may have only one die
instead of 2.

### Game Data Structure

A game, at any given point, is made of the following criteria:
- `state`: one of the 3 states described above
- `players`: an array of players. Each
- `rules`: a set of rules for the games. Specifically, these are rules
  on all the various variants described above.
- `history`: a history of moves.

Based on all of these, one can derive the Game View, which is a way to
see what the board looks like. The display function on the front-end will
simply derive the game view from the history, which will allow for easy
local displaying. What will be updated in each turn is simply the move that
was played.

#### Game State

This was described above. We have the `WAITING` state, the `ONGOING` state,
and the `COMPLETED` state. Note here that `COMPLETED` doesn't necessarily mean
that all players have graduated. Often, Ludo doesn't end. So, whenever any
one player gives up, the whole game ends.

#### Game Players

This is an object with keys `1`, `2`, `3`, and `4` where `1` is the host
player, `2` is an active player, and `3` and `4` may either be `null` or
other players (if `3` is `null`, `4` is also `null`).

The value of the objects are player informations:
- `username` for their name in the game
- `color`, which will always be assigned randomly

#### Game Rules

TODO: Work in progress. Ideally, we want to find all the various variants
first and figure out a simple way to describe them.

#### Game History

A game is essentially a sequence of moves. Players play sequentially. So,
a game is an array of objects (hashes) with the following keys:
- `r`: this represents the rolls. This is an array of rolls.
- `a`: this is an array that represents the action(s) taken for reach roll.
 The actions are of the form `A P R` where `A` is the action, `P` is
 which piece took the action, and `R` is the roll. The actions we
 have are `begin`, `move`, `rescue`, `null`, and `stop`.
 - `P`: This is one of {`X.1`, `X.2`, `X.3`, `X.4`}. `X` represents the player
   that is taking the action, and the other number represents which piece the
   player moved.
 - `R`: This must be in the set of rolls and must be a one to one mapping from
   each roll to each action.
 - `begin`: This must be accompanied by a piece that is in the home and with
   a roll of `6`.
 - `move`: this is used to move pieces. This move encodes a lot of information.
   The game will know when a move lands on another player's piece and what to
   do in that case, and this is also used for graduation and such.
 - `rescue`: in playing the variant where players get captured into other player
   players' homes, then rescue takes a piece and moves them out into one's home.
 - `null`: When there are no valid moves with the pieces given, then the null
   action is taken with that roll. The piece for this is ignored.
 - `stop`: A stop action is when a player gives up. Essentially what happens
   here is that the game stops. If a player quit their browser window, that
   would also count as a `stop`. With a `stop`, the roll used would be `0`.

#### Game View

Based on the game history and the game rules, we can easily derive the
game view. So, this is a function of game rules and game history. Let `N`
be the number of players playing. Then, the game view will be an object
with the following:
- `homes`: An array of `N` arrays where each array can only contain
  elements {`1`, `2`, `3`, `4`} which represents each of the players' pieces.
  Array at index `i` is for player `i+1`.
- `cells`: An array of the outer layer path. Each element of the array is
  either an empty array or an array of pieces that is on it. The pieces are of
  the `P` form described in the game history. The first element of the array
  represents the exit out of the host home.
- `graduations`: An array of `N` arrays containing 7 slots. Index `i`
  represents hte graduation cell at `i+1` for this player. Then, index `6`
  (the last index) represents whether they've actually graduated.

