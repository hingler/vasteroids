import { Asteroid } from "../instances/Asteroid";
import { InstanceType, Instance } from "../instances/GameTypes";
import { ClientShip } from "../instances/Ship";

interface InstanceInfo {
  asteroids: Array<Asteroid>,
  ships: Array<ClientShip>,
  deltas: Array<Instance>
  // TODO: record deleted IDs.
}

interface ServerPacket {
  instances: Array<InstanceInfo>;
}

export { ServerPacket, InstanceInfo };