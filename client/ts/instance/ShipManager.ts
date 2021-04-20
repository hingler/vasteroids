import { chunkSize, Point2D } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";

/**
 * ShipManager keeps track of updates on player's ship.
 */
export class ShipManager {
  ship: ClientShip;
  accel: number;
  accel_rot: number;
  last_update: number;
  update_intvl: NodeJS.Timeout;

  constructor(ship: ClientShip) {
    this.ship = ship;
    this.last_update = performance.now() / 1000;
    this.accel = 0;
    this.accel_rot = 0;
    this.update_intvl = setInterval(this.update.bind(this), 5);
  }

  setThrust(accel: number) {
    this.accel = accel;
  }

  setRotThrust(accel: number) {
    this.accel_rot = accel;
  }

  /**
   * Called once every ~5ms to update the ship's state.
   */
  update() : void {
    let update = performance.now() / 1000;
    let delta = update - this.last_update;
    this.last_update = update;

    // update position based on current velocity
    this.ship.position.position.x += this.ship.velocity.x * delta;
    this.ship.position.position.y += this.ship.velocity.y * delta;

    let pos = this.ship.position.position;

    // adjust position if offset
    if (pos.x < 0 || pos.x >= chunkSize || pos.y < 0 || pos.y > chunkSize) {
      this.ship.position.chunk.x += Math.floor(pos.x / chunkSize);
      this.ship.position.chunk.y += Math.floor(pos.y / chunkSize);
      this.ship.position.position.x -= chunkSize * Math.floor(pos.x / chunkSize);
      this.ship.position.position.y -= chunkSize * Math.floor(pos.y / chunkSize);
    }

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
    delta_v.x = delta_v.x * Math.cos(this.ship.rotation);
    delta_v.y = delta_v.x * Math.sin(this.ship.rotation);

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
  }
}