import { Instance } from "./GameTypes"

export interface Projectile extends Instance {

  // positive, non-zero ID used by the client to disambiguate projectiles 
  clientID: number;
  creationTime: number;
}