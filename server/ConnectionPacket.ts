import { ClientShip } from "../instances/Ship"

/**
 * Sent to the client when they first connect to the server.
 */
interface ConnectionPacket {
  ship: ClientShip;
  playerToken: string;
  chunkDims: number;
  serverTime: number;
}

export { ConnectionPacket };