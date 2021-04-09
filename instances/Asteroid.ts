import { Point2D, Instance } from "./GameTypes"

interface Asteroid extends Instance {
  geometry: Array<Point2D>;
}

export { Asteroid };