interface Point2D {
  x: number;
  y: number;
}

interface Asteroid {
  geometry: Array<Point2D>;
  velocity: Point2D;
  position: Point2D;
  rotation: number;
  rotation_velocity: number;
}

export { Point2D, Asteroid };