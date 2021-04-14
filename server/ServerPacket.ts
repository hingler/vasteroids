import { Asteroid } from "../instances/Asteroid";
import { InstanceType, Instance } from "../instances/GameTypes";
import { ClientShip } from "../instances/Ship";

interface ServerPacket {
  asteroids: Array<Asteroid>,
  ships: Array<ClientShip>,
  deltas: Array<Instance>,
  deleted: Array<number>
}

export { ServerPacket };