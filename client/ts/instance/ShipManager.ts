import { chunkSize, Point2D } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";
import { InputManager } from "../input/InputManager";
import { KeyInputManager } from "../input/KeyInputManager";
import { MouseInputManager } from "../input/MouseEventManager";
import { setUpdateOrigin, UpdateInstance } from "./UpdateInstance";

/**
 * ShipManager keeps track of updates on player's ship.
 */
export class ShipManager {
  ship: ClientShip;
  accel: number;
  accel_rot: number;
  last_update: number;
  update_intvl: NodeJS.Timeout;
  origin_time: number;
  inputmgr: InputManager;
  shootState: number;
  lastShot: number;

  constructor(ship: ClientShip, serverOrigin: number) {
    this.ship = ship;
    this.origin_time = serverOrigin - (performance.now() / 1000);
    // offset
    this.ship.last_delta = serverOrigin;
    console.log(this.ship);
    this.last_update = serverOrigin;
    this.accel = 0;
    this.accel_rot = 0;
    this.inputmgr = new KeyInputManager(this.origin_time);
    this.lastShot = performance.now() / 1000;

    setUpdateOrigin(serverOrigin);
  }

  isShoot() : boolean {
    return this.inputmgr.isShoot();
  }

  setThrust(accel: number) {
    this.accel = accel;
  }

  setRotThrust(accel: number) {
    this.accel_rot = accel;
  }

  getShip() : ClientShip {
    return this.ship;
  }

  collide() : void {
    this.ship.destroyed = true;
  }

  /**
   * Called once every ~5ms to update the ship's state.
   */
  update(dims: number) : void {
    this.inputmgr.updateShipState(this.ship);
    UpdateInstance(this.ship, dims);
  }
}