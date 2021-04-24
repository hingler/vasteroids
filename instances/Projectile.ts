import { Instance } from "./GameTypes"

export interface Projectile extends Instance {
  // server time at which this projectile was created.
  creationTime: number;

  // positive, non-zero ID used by the client to disambiguate projectiles 
  clientID: number;
}