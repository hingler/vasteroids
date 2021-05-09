import { Point2D } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";
import { Input, InputManager, MAX_ROT_THRUST, MAX_THRUST, SHOT_DELAY } from "./InputManager";

/**
 * List of inputs we want to keep track of
 */
export class KeyInputManager implements InputManager {
  keys: Map<string, Input>;
  inputState: Map<Input, boolean>;
  origin_time: number;
  shot: boolean;
  shot_last: number;
  constructor(origin_time: number) {
    this.origin_time = origin_time;
    this.shot_last = origin_time;
    this.shot = false;
    // set up key map
    this.setDefaultBindings();
    // map from keycode to input
    // use event listener on canvas to see which input was fired
    window.addEventListener("keydown", this.EventFuncOn_.bind(this));
    window.addEventListener("keyup", this.EventFuncOff_.bind(this));
    // note: devise an alternative input method for mobile devices
    // 
    // modify input state to fit
    // we'll poll InputManager on a consistent interval to see what keys are pressed
    // update ShipManager accordingly
  }

  isShoot() {
    let shot_delta = this.origin_time + (performance.now() / 1000) - this.shot_last;
    if (this.getInputState(Input.SHOOT)) {
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
      let accel = 0, accel_rot = 0;

      if (this.getInputState(Input.THRUST_FWD)) {
        accel += MAX_THRUST;
      }

      if (this.getInputState(Input.THRUST_BKD)) {
        accel -= MAX_THRUST;
      }

      if (this.getInputState(Input.TURN_LEFT)) {
        accel_rot += MAX_ROT_THRUST;
      }

      if (this.getInputState(Input.TURN_RIGHT)) {
        accel_rot -= MAX_ROT_THRUST;
      }

      let update = this.origin_time + (performance.now() / 1000);
      let delta = Math.min(update - ship.last_delta, 0.4);


      let delta_v : Point2D = {x: 1, y: 0};
      delta_v.x *= accel * delta;
      let v_z = ship.velocity;

      let damp = { x: -v_z.x / 0.4, y: -v_z.y / 0.4 };
      // account for delta
      damp.x *= delta;
      damp.y *= delta;

      delta_v.y = -(delta_v.x * Math.sin(ship.rotation));
      delta_v.x = delta_v.x * Math.cos(ship.rotation);

      // add velocity
      ship.velocity.x += delta_v.x;
      ship.velocity.y += delta_v.y;

      // account for damping
      ship.velocity.x += damp.x;
      ship.velocity.y += damp.y;

      // same for rotation
      let delta_r = accel_rot * delta;

      let rot = ship.rotation_velocity;
      let rot_damp = -rot / 0.4;
      rot_damp *= Math.min(delta, 0.4);

      // push new rotation velocity
      ship.rotation_velocity += delta_r;
      ship.rotation_velocity += rot_damp;
    }
  }

  getInputState(input: Input) : boolean {
    return this.inputState.get(input);
  }

  setDefaultBindings() {
    this.keys = new Map();
    this.inputState = new Map();

    this.bindKey('w', Input.THRUST_FWD); // 'w'
    this.bindKey('s', Input.THRUST_BKD); // 's'
    this.bindKey('a', Input.TURN_LEFT);  // 'a'
    this.bindKey('d', Input.TURN_RIGHT); // 'd'
    this.bindKey(' ', Input.SHOOT);      // SPACEBAR
  }

  bindKey(keycode: string, input: Input) {
    this.keys.set(keycode, input);
  }

  unbindKey(keycode: string, input: Input) {
    this.keys.delete(keycode);
  }

  /**
   * Unbinds all keys associated with a particular input.
   * @param input - the input which we want to clear.
   */
  clearBinding(input: Input) {
    let clear : Array<string> = [];
    for (let map of this.keys) {
      if (map[1] === input) {
        clear.push(map[0]);
      }
    }

    for (let key of clear) {
      this.keys.delete(key);
    }
  }

  private EventFuncOn_(e: KeyboardEvent) {
    let input = this.keys.get(e.key);
    if (input) {
      this.inputState.set(input, true);
    }
  }

  private EventFuncOff_(e: KeyboardEvent) {
    let input = this.keys.get(e.key);
    if (input) {
      this.inputState.set(input, false);
    }
  }
}