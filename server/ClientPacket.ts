import { ClientShip } from "../instances/Ship"

interface ClientPacket {
  // information on the client's ship itself
  ship: ClientShip;

  // true if a projectile was just fired -- false otherwise.
  projectileFired: boolean;

  // token associated with a given player -- used to authenticate requests
  playerToken: string;
}

export { ClientPacket };