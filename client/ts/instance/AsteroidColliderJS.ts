import { Asteroid } from "../../../instances/Asteroid";
import { chunkSize, Point2D, WorldPosition } from "../../../instances/GameTypes";

export function GetDistance(a: Asteroid, pt: WorldPosition, dims: number) {
  let chunkDist: Point2D = {
    x: pt.chunk.x - a.position.chunk.x,
    y: pt.chunk.y - a.position.chunk.y
  };

  let pointPos : Point2D = pt.position;

  let asteroidPos : Point2D = {
    x: a.position.position.x,
    y: a.position.position.y
  };

  asteroidPos.x -= chunkDist.x * chunkSize;
  asteroidPos.y -= chunkDist.y * chunkSize;

  let pointRel : Point2D = {
    x: pointPos.x - asteroidPos.x,
    y: pointPos.y - asteroidPos.y
  };

  if (pointRel.x > (chunkSize * dims) / 2) {
    pointRel.x -= (chunkSize * dims);
  } else if (pointRel.x < -(chunkSize * dims) / 2) {
    pointRel.x += (chunkSize * dims);
  }

  if (pointRel.y > (chunkSize * dims) / 2) {
    pointRel.y -= (chunkSize * dims);
  } else if (pointRel.y < -(chunkSize * dims) / 2) {
    pointRel.y += (chunkSize * dims);
  }

  return Math.sqrt(pointRel.x * pointRel.x + pointRel.y * pointRel.y);
}

/**
 * Returns a vector from asteroid to point.
 * @param a - asteroid start point.
 * @param pt - end point.
 * @param dims - number of chunks in world per dim
 * @returns - point2D vector representing distance between points.
 */
export function GetVector(a: Asteroid, pt: WorldPosition, dims: number) : Point2D {
  let chunkDist: Point2D = {
    x: pt.chunk.x - a.position.chunk.x,
    y: pt.chunk.y - a.position.chunk.y
  };

  let pointPos : Point2D = pt.position;
  let asteroidPos : Point2D = {
    x: a.position.position.x,
    y: a.position.position.y
  };
  
  asteroidPos.x -= chunkDist.x * chunkSize;
  asteroidPos.y -= chunkDist.y * chunkSize;

  let pointRel : Point2D = {
    x: pointPos.x - asteroidPos.x,
    y: pointPos.y - asteroidPos.y
  };

  if (pointRel.x > (chunkSize * dims) / 2) {
    pointRel.x -= (chunkSize * dims);
  } else if (pointRel.x < -(chunkSize * dims) / 2) {
    pointRel.x += (chunkSize * dims);
  }

  if (pointRel.y > (chunkSize * dims) / 2) {
    pointRel.y -= (chunkSize * dims);
  } else if (pointRel.y < -(chunkSize * dims) / 2) {
    pointRel.y += (chunkSize * dims);
  }

  return pointRel;
}

// port of our cpp function for clients
export function Collide(a: Asteroid, pt: WorldPosition, dims: number) : boolean {
  let pointRel = GetVector(a, pt, dims);

  let rc = Math.cos(-a.rotation);
  let rs = Math.sin(-a.rotation);

  pointRel = {
    x: pointRel.x * rc + pointRel.y * rs,
    y: pointRel.x * -rs + pointRel.y * rc
  };

  return CollideChunkLocal(a, pointRel, dims);
}

function CollideChunkLocal(a: Asteroid, pt: Point2D, dims: number) : boolean {
  let windDistance = 0;
  let thetaLast : number, dTheta : number;

  const astLast = a.geometry.length - 1;

  let delta : Point2D = {
    x: a.geometry[astLast].x - pt.x,
    y: a.geometry[astLast].y - pt.y
  };

  thetaLast = Math.atan2(delta.y, delta.x);

  for (let i = 0; i < a.geometry.length; i++) {
    delta.x = a.geometry[i].x - pt.x;
    delta.y = a.geometry[i].y - pt.y;
    dTheta = Math.atan2(delta.y, delta.x) - thetaLast;
    if (dTheta > Math.PI) {
      dTheta -= (2 * Math.PI);
    } else if (dTheta < -Math.PI) {
      dTheta += (2 * Math.PI);
    }

    windDistance += dTheta;
    // use dTheta + thetaLast here to avoid addl atan2 call?
    thetaLast = Math.atan2(delta.y, delta.x);
  }

  return Math.abs(windDistance) > Math.PI;
}