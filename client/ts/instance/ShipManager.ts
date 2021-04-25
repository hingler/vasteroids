import { chunkSize, Point2D } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";
import { Input, InputManager } from "../input/InputManager";
import { KeyInputManager } from "../input/KeyInputManager";
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

  constructor(ship: ClientShip, serverOrigin: number) {
    this.ship = ship;
    this.origin_time = serverOrigin - (performance.now() / 1000);
    // offset
    this.ship.last_delta = serverOrigin;
    console.log(this.ship);
    this.last_update = serverOrigin;
    this.accel = 0;
    this.accel_rot = 0;
    this.inputmgr = new KeyInputManager();

    setUpdateOrigin(serverOrigin);
  }

  isShoot() : boolean {
    if (this.inputmgr.getInputState(Input.SHOOT)) {
      switch(this.shootState) {
        case 0:
          this.shootState = 1;
          return true;
        case 1:
          return false;
      }
    } else {
      this.shootState = 0;
      return false;
    }
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

  /**
   * Called once every ~5ms to update the ship's state.
   */
  update(dims: number) : void {
    this.accel = 0;
    this.accel_rot = 0;
    if (this.inputmgr.getInputState(Input.THRUST_FWD)) {
      this.accel += 8;
    }

    if (this.inputmgr.getInputState(Input.THRUST_BKD)) {
      this.accel -= 8;
    }

    if (this.inputmgr.getInputState(Input.TURN_LEFT)) {
      this.accel_rot += 18;
    }

    if (this.inputmgr.getInputState(Input.TURN_RIGHT)) {
      this.accel_rot -= 18;
    }

    // capture delta before updateinstance updates it
    let update = this.origin_time + (performance.now() / 1000);
    let delta = update - this.ship.last_delta;

    UpdateInstance(this.ship, dims);

    // modify veloicty

    // get delta velocity based on thrust
    let delta_v : Point2D = {x: 1, y: 0};
    delta_v.x *= this.accel * delta;

    // calculate damping force right away
    let v_z = this.ship.velocity;
    
    let damp = { x: -v_z.x / 0.4, y: -v_z.y / 0.4 };
    // account for delta
    damp.x *= Math.min(delta, 0.4);
    damp.y *= Math.min(delta, 0.4);
    
    // handle rotation
    // default direction: head right!
    delta_v.y = -(delta_v.x * Math.sin(this.ship.rotation));
    delta_v.x = delta_v.x * Math.cos(this.ship.rotation);
    // flip on y axis since up is negative

    // add velocity
    this.ship.velocity.x += delta_v.x;
    this.ship.velocity.y += delta_v.y;

    // account for damping
    this.ship.velocity.x += damp.x;
    this.ship.velocity.y += damp.y;

    // same for rotation


    let delta_r = this.accel_rot * delta;

    let rot = this.ship.rotation_velocity;
    let rot_damp = -rot / 0.4;
    rot_damp *= Math.min(delta, 0.4);

    // push new rotation velocity
    this.ship.rotation_velocity += delta_r;
    this.ship.rotation_velocity += rot_damp;

    // temp
    document.getElementById("ship").textContent = `pos: ${this.ship.position.position.x}, ${this.ship.position.position.y}
    velo: ${this.ship.velocity.x}, ${this.ship.velocity.y}`
  }
}