import { Point2D } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";
import { DAMP_COEFF, InputManager, MAX_ROT_THRUST, MAX_THRUST, SHOT_DELAY } from "./InputManager";

enum Direction {
  CW,
  CCW
};

export class MouseInputManager implements InputManager {
  inputThrust: boolean;
  inputShoot: boolean;

  origin_time: number;
  shot: boolean;
  shot_last: number;

  mouse_pos: Point2D;

  constructor(origin_time: number) {
    this.origin_time = origin_time;
    this.shot_last = origin_time;
    this.shot = false;

    this.mouse_pos = {x: 0, y: 0};

    window.addEventListener("mousedown", this.EventFuncOn_.bind(this));
    window.addEventListener("mouseup", this.EventFuncOff_.bind(this));
    window.addEventListener("mousemove", this.EventFuncMouseMove_.bind(this));

    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  private EventFuncOn_(e: MouseEvent) {
    switch (e.button) {
      case 0:
        this.inputThrust = true;
        break;
      case 2:
        this.inputShoot = true;
    }
  }

  private EventFuncOff_(e: MouseEvent) {
    switch (e.button) {
      case 0:
        this.inputThrust = false;
        break;
      case 2:
        this.inputShoot = false;
    }
  }

  private EventFuncMouseMove_(e: MouseEvent) {
    this.mouse_pos.x = e.x, this.mouse_pos.y = e.y;
  }

  isShoot() {
    let shot_delta = this.origin_time + (performance.now() / 1000) - this.shot_last;
    if (this.inputShoot) {
      if (this.shot || shot_delta < SHOT_DELAY) {
        return false;
      }

      this.shot = true;
      return true;
    } else {
      this.shot = false;
    }
  }

  updateShipState(ship: ClientShip) {
    if (ship.destroyed) {
      ship.velocity.x = ship.velocity.y = 0;
    } else {
      // thrust works same as before
      // for rotation, set velocity in direction of mouse
      // cap rot velocity at (rot thrust * damping force)
      // and then 3 * distance.
      let accel = 0;
      if (this.inputThrust) {
        accel += MAX_THRUST;
      }

      // same as keyinputmanager:
      let update = this.origin_time + (performance.now() / 1000);
      let delta = update - ship.last_delta;

      let delta_v : Point2D = {x: 1, y: 0};
      delta_v.x *= accel * delta;
      let v_z = ship.velocity;

      let damp = { x: -v_z.x / 0.4, y: -v_z.y / 0.4 };
      // account for delta
      damp.x *= Math.min(delta, 0.4);
      damp.y *= Math.min(delta, 0.4);

      delta_v.y = -(delta_v.x * Math.sin(ship.rotation));
      delta_v.x = delta_v.x * Math.cos(ship.rotation);

      // add velocity
      ship.velocity.x += delta_v.x;
      ship.velocity.y += delta_v.y;

      // account for damping
      ship.velocity.x += damp.x;
      ship.velocity.y += damp.y;

      // handle rotation
      let center = {
        x: window.innerWidth / 2,
        y: window.innerWidth / 2
      };

      let angle = Math.atan2(-(this.mouse_pos.y - center.y), this.mouse_pos.x - center.x);
      let d_angle = angle - ship.rotation;
      let d_abs = Math.abs(d_angle);
      let dir : Direction = ((d_angle > 0) !== (d_abs > Math.PI) ? Direction.CCW : Direction.CW);
      d_abs = Math.min(d_abs, (2 * Math.PI) - d_abs);
      let thrust = (dir === Direction.CCW ? 6 * d_abs : -6 * d_abs);
      if (Math.abs(thrust) > DAMP_COEFF * MAX_ROT_THRUST) {
        thrust *= (DAMP_COEFF * MAX_ROT_THRUST / Math.abs(thrust));
      }
      
      ship.rotation_velocity = thrust;
    }
  }
}