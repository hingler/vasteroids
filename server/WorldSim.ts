
import { ClientPacket } from "../server/ClientPacket"
import { ClientShip } from "../instances/Ship";
import { Point2D } from "../instances/GameTypes";
import { BiomeInfo } from "../instances/Biome";

const worldsim = require("bindings")("worldsim");
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
   */
  HandleClientPacket(packet: ClientPacket) : void;

  /**
   * Updates the simulation. Should be done once per server tick.
   *   (we could JSONify this for NODE?)
   * @returns an object mapping IDs to server packets.
   */ 
  UpdateSim() : any;

  /**
   * Respawns she ship associated with a given ID, if it exists.
   * @param id - the ID of the ship we are respawning.
   */
  RespawnShip(id: number) : ClientShip;

  /**
   * Adds a new ship to the world sim.
   * @param name - the name associated with the new ship.
   * @returns a new object representing the current state of the ship.
   */
  AddShip(name: string) : ClientShip;

  /**
   * Removes a ship from this WorldSim.
   * @param id - the ID of the ship we wish to remove.
   * @returns true if the ship can be removed, false otherwise.
   */
  DeleteShip(id: number) : boolean;

  /**
   * Gets current server time.
   * @returns server time.
   */
  GetServerTime() : number;

  /**
   * Fetches information on localbiomes.
   * @param origin - top left corner of fetched range.
   * @param dims - number of chunks to return on x/y axis. cannot be greater than 32.
   */
  GetLocalBiomeInfo(origin: Point2D, dims: Point2D) : Array<BiomeInfo>;

  /**
   * Returns the relative amount of activity in nearby chunks.
   * @param origin - the top-left chunk we wish to fetch.
   * @param dims - the number of chunks fetched along x and y axes.
   * @returns a 2D array containing the relative activity in each chunk.
   */
  // GetLocalChunkActivity(origin: Point2D, dims: Point2D) : Array<Array<number>>;
}

function CreateWorldSim(size: number, asts: number) : WorldSim {
  return new worldsim.sim(size, asts) as WorldSim;
}

export { CreateWorldSim, WorldSim };