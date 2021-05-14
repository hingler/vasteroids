import { Projectile } from "../instances/Projectile";
import { ClientShip } from "../instances/Ship"

interface ClientPacket {
  // information on the client's ship itself
  ship: ClientShip;

  projectiles: Array<Projectile>;

  // token associated with a given player -- used to authenticate requests
  playerToken: string;

  // unique client-determined ID returned in order to track ping.
  // id: number;
}

export { ClientPacket };