import { Instance } from "./GameTypes";

interface ClientShip extends Instance {
  // name of the client
  name: string;

  // score of assc'd player
  score: number;

  // true if the ship is destroyed
  destroyed: boolean;

  // number of lives remaining on the ship.
  lives: number;
}

export { ClientShip };