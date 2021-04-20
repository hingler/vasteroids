export enum Input {
  THRUST_FWD,
  THRUST_BKD,
  TURN_LEFT,
  TURN_RIGHT,
  SHOOT
}

export interface InputManager {
  /**
   * Fetches the state of a particular input.
   * @param input - the input whose state we are fetching.
   */
  getInputState(input: Input) : boolean;
}