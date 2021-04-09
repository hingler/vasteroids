import { InstanceType, Instance } from "../instances/GameTypes";

interface InstanceInfo {
  type: InstanceType;
  data: Array<Instance>;
}

interface ServerPacket {
  instances: Array<InstanceInfo>;
}

export { ServerPacket };