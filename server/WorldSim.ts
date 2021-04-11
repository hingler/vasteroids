
import { ClientPacket } from "../client/ClientPacket"
import { Point2D } from "../instances/GameTypes";
import { ServerPacket } from "./ServerPacket";
/**
 *  Represents the component which handles and updates the state of the game world. 
 */
interface WorldSim {

  /**
   * @returns the number of chunks in the X/Y directions.
   */
  GetChunkDims() : number;

  /**
   * Handles updates from clients.
   * @param packet - The packet being updated.
   * @returns a server packet which contains updates to local features.
   */
  HandleClientPacket(packet: ClientPacket) : ServerPacket;

  /**
   * Returns the relative amount of activity in nearby chunks.
   * @param origin - the top-left chunk we wish to fetch.
   * @param dims - the number of chunks fetched along x and y axes.
   * @returns a 2D array containing the relative activity in each chunk.
   */
  GetLocalChunkActivity(origin: Point2D, dims: Point2D) : Array<Array<number>>;
}