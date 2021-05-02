import { ClientShip } from "../../../instances/Ship";

export enum Input {
  THRUST_FWD = 1,
  THRUST_BKD = 2,
  TURN_LEFT = 3,
  TURN_RIGHT = 4,
  SHOOT = 5
}

export enum InputMethod {
  MOUSE = 1,
  KEYBOARD = 2,
  TOUCH = 3
}

export enum Direction {
  CW,
  CCW
}

export const MAX_THRUST = 8;
export const MAX_ROT_THRUST = 18;
export const DAMP_COEFF = 0.4;
export const SHOT_DELAY = 0.05;

export abstract class InputManager {

  /** 
   *  Calculates and updates the ship's movement based on inputs.
   */
  abstract updateShipState(ship: ClientShip) : void;

  /**
   * True if the ship is shooting, false otherwise.
   */
  abstract isShoot() : boolean;
}