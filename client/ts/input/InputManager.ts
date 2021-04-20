export enum Input {
  THRUST_FWD = 1,
  THRUST_BKD = 2,
  TURN_LEFT = 3,
  TURN_RIGHT = 4,
  SHOOT = 5
}

export interface InputManager {
  /**
   * Fetches the state of a particular input.
   * @param input - the input whose state we are fetching.
   */
  getInputState(input: Input) : boolean;
}