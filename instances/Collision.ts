import { Instance } from "./GameTypes";

// represents a collision on server side
export interface Collision extends Instance {
  // time at which this collision began.
  creationTime: number;
}