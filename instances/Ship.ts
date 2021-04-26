import { Instance } from "./GameTypes";

interface ClientShip extends Instance {
  // name of the client
  name: string;
  score: number;
}

export { ClientShip };