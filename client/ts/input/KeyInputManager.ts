import { Input, InputManager } from "./InputManager";

/**
 * List of inputs we want to keep track of
 */
export class KeyInputManager implements InputManager {
  keys: Map<string, Input>;
  inputState: Map<Input, boolean>;
  constructor() {
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
    console.log(keycode);
    this.keys.set(keycode, input);
    console.log(this.keys.get(keycode));
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
    console.log(this.keys.get('w'));
    let input = this.keys.get(e.key);
    console.log("pressed " + e.key);
    if (input) {
      console.log("registered " + e.key + "!");
      this.inputState.set(input, true);
    }
  }

  private EventFuncOff_(e: KeyboardEvent) {
    let input = this.keys.get(e.key);
    if (input) {
      console.log("released " + e.key + "!");
      this.inputState.set(input, false);
    }
  }
}