enum InstanceType {
  ASTEROID = "asteroid",
  SHIP = "ship",
  PROJECTILE = "projectile"
};

interface Point2D {
  x: number;
  y: number;
}

/**
 * Represents a single unique location in our world.
 */
interface WorldPosition {
  chunk: Point2D;
  position: Point2D;
}

/**
 * Represents any object which may occupy a chunk of our world.
 */
interface Instance {
  // the position of this instance.
  position: WorldPosition;

  velocity: Point2D;

  rotation: number;

  rotation_velocity: number;

  // the time at which this instance was created, rel. to the server.
  creation_time: number;

  // a unique identifier for this instance.
  id: number;
}

export { InstanceType, Point2D, WorldPosition, Instance }