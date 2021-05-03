import { Point2D } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";
import { DAMP_COEFF, Direction, InputManager, MAX_ROT_THRUST, MAX_THRUST, SHOT_DELAY } from "./InputManager";

export class TouchInputManager implements InputManager {
  origin_time: number;
  shot: boolean;
  shot_last: number;

  move_touch_id: number;

  touch_dir: number;

  constructor(origin_time: number) {
    this.origin_time = origin_time;
    this.shot = false;
    this.shot_last = origin_time;

    this.move_touch_id = -1;
    
    this.touch_dir = 0;

    window.addEventListener("touchstart", this.touchBegin_.bind(this));
    window.addEventListener("touchend", this.touchEnd_.bind(this));
    window.addEventListener("touchmove", this.touchUpdate_.bind(this));
  }

  getTouchState() : number {
    return this.touch_dir;
  }

  isShoot() {
    let time = this.origin_time + (performance.now() / 1000)
    let shot_delta = time - this.shot_last;
    // triggered only for one frame when the user touches
    if (this.shot && shot_delta > SHOT_DELAY) {
      this.shot_last = time;
      this.shot = false;
      return true;
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
      if (this.move_touch_id >= 0) {
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
        y: window.innerHeight / 2
      };

      let angle = this.touch_dir;

      let ship_rot = ship.rotation;
      ship_rot -= Math.floor(ship_rot / (2 * Math.PI)) * (2 * Math.PI);
      if (ship_rot > Math.PI) {
        ship_rot = ship_rot - (Math.PI * 2);
      }

      let d_angle = angle - ship_rot;
      let d_abs = Math.abs(d_angle);
      let dir : Direction;
      if (d_abs > Math.PI) {
        dir = (angle > ship_rot ? Direction.CCW : Direction.CW);
      } else {
        dir = (angle > ship_rot ? Direction.CW : Direction.CCW);
      }

      d_abs = Math.min(d_abs, (2 * Math.PI) - d_abs);
      let thrust = (dir === Direction.CCW ? -6 * d_abs : 6 * d_abs);
      if (Math.abs(thrust) > DAMP_COEFF * MAX_ROT_THRUST) {
        thrust *= (DAMP_COEFF * MAX_ROT_THRUST / Math.abs(thrust));
      }
      
      ship.rotation_velocity = thrust;
    }
  }

  private touchBegin_(e: TouchEvent) {
    let h = document.body.clientHeight;
    let w = document.body.clientWidth;
    for (let touch of e.changedTouches) {
      if (touch.pageX > 32 && touch.pageX < 288
       && touch.pageY < (h - 64) && touch.pageY > (h - 320)) {
        if (this.move_touch_id < 0) {
          this.move_touch_id = touch.identifier;
          this.setTouchDir_(touch);
        }
      } else if (touch.pageX < (w - 32) && touch.pageX > (w - 288)
              && touch.pageY < (h - 64) && touch.pageY > (h - 320)) {
        this.shot = true;
      }
    }
  }

  private setTouchDir_(t: Touch) {
    let x = t.pageX - 192;
    let y = document.body.clientHeight - (t.pageY + 192);
    let dir = Math.atan2(y, x);
    this.touch_dir = dir;
  }

  private touchEnd_(e: TouchEvent) {
    for (let touch of e.changedTouches) {
      if (touch.identifier === this.move_touch_id) {
        this.move_touch_id = -1;
      }
    }
  }

  private touchUpdate_(e: TouchEvent) {
    for (let touch of e.changedTouches) {
      if (touch.identifier === this.move_touch_id) {
        this.setTouchDir_(touch);
      }
    }
  }
}