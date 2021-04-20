import { chunkSize, Point2D } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";
import { Input, InputManager } from "../input/InputManager";
import { KeyInputManager } from "../input/KeyInputManager";
import { UpdateInstance } from "./UpdateInstance";

/**
 * ShipManager keeps track of updates on player's ship.
 */
export class ShipManager {
  ship: ClientShip;
  accel: number;
  accel_rot: number;
  last_update: number;
  update_intvl: NodeJS.Timeout;
  inputmgr: InputManager;

  constructor(ship: ClientShip) {
    this.ship = ship;
    this.ship.last_delta = performance.now();
    console.log(this.ship);
    this.last_update = performance.now() / 1000;
    this.accel = 0;
    this.accel_rot = 0;
    this.inputmgr = new KeyInputManager();
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
  update() : void {
    this.accel = (this.inputmgr.getInputState(Input.THRUST_FWD) ? 2 : 0);
    this.accel_rot = 0;
    if (this.inputmgr.getInputState(Input.TURN_LEFT)) {
      this.accel_rot += 2;
    }

    if (this.inputmgr.getInputState(Input.TURN_RIGHT)) {
      this.accel_rot -= 2;
    }

    // capture delta before updateinstance updates it
    let update = performance.now() / 1000;
    let delta = update - this.ship.last_delta;

    UpdateInstance(this.ship);

    // modify veloicty

    // get delta velocity based on thrust
    let delta_v : Point2D = {x: 1, y: 0};
    delta_v.x *= this.accel * delta;

    // calculate damping force right away
    let v_z = this.ship.velocity;
    
    let damp = { x: -v_z.x / 1.8, y: -v_z.y / 1.8 };
    // account for delta
    damp.x *= delta;
    damp.y *= delta;
    
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
    let rot_damp = -rot / 1.8;
    rot_damp *= delta;

    // push new rotation velocity
    this.ship.rotation_velocity += delta_r;
    this.ship.rotation_velocity += rot_damp;

    // temp
    document.getElementById("ship").textContent = `pos: ${this.ship.position.position.x}, ${this.ship.position.position.y}
    velo: ${this.ship.velocity.x}, ${this.ship.velocity.y}`
  }
}