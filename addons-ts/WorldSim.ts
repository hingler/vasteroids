import { ClientPacket } from "../client/ClientPacket";
import { Point2D } from "../instances/GameTypes";
import { ServerPacket } from "../server/ServerPacket";

/**
 * The WorldSim is the component which handles the simulation of our game world.
 */
interface WorldSim {
  /**
   * Updates the state of the world, returning a new, updated state.
   * @param info - packet sent by the client.
   * @returns a ServerPacket, containing information on events near the client.
   */
  updateState(info: ClientPacket) : ServerPacket;

  

  /**
   * Returns the relative activity in nearby chunks.
   * @param startChunk - the top-left chunk whose activity we wish to fetch.
   * @param chunkDims - the number of chunks to fetch in the X and Y directions.
   * @returns a 2D array containing the relative activity in chunks, top to bottom, left to right,
   *          with the top left chunk being startChunk. Higher number = more activity.
   */
  getLocalChunks(startChunk: Point2D, chunkDims: Point2D) : Array<Array<number>>;
}