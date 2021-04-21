import { chunkSize, Instance, Point2D } from "../../../instances/GameTypes";

export function UpdateInstance(i: Instance, chunkDims: number) {
  let update = performance.now() / 1000;
  let delta = update - i.last_delta;
  i.last_delta = update;

  if (delta > 0.1) {
    console.error("large delta: " + delta);
  }

  // update position based on current velocity
  i.position.position.x += i.velocity.x * delta;
  i.position.position.y += i.velocity.y * delta;

  let pos = i.position.position;

  fixChunkOffset(i, chunkDims);

  i.rotation += i.rotation_velocity * delta;
}

export function UpdateAndInterpolate(il: Instance, ip: Instance, chunkDims: number) {
  let delta = (performance.now() / 1000) - il.last_delta;
  let t = 1 - Math.pow(0.0001, delta);

  UpdateInstance(il, chunkDims);
  UpdateInstance(ip, chunkDims);

  // both are updated
  // nudge il by the difference
  let posDist = getDistance(il, ip);
  il.position.position.x += posDist.x * t;
  il.position.position.y += posDist.y * t;
  fixChunkOffset(il, chunkDims);
  console.log(posDist);

  // do the same for velocity
  let velo = {} as Point2D;
  velo.x = (ip.velocity.x - il.velocity.x);
  velo.y = (ip.velocity.y - il.velocity.y);

  // use proper lerp function later
  il.velocity.x += velo.x * t;
  il.velocity.y += velo.y * t;

  il.rotation += (ip.rotation - il.rotation) * t;
  il.rotation_velocity += (ip.rotation_velocity - il.rotation_velocity) * t;
}

function fixChunkOffset(i: Instance, chunkDims: number) {
  let pos = i.position.position;
  if (pos.x < 0 || pos.x >= chunkSize || pos.y < 0 || pos.y > chunkSize) {
    i.position.chunk.x += Math.floor(pos.x / chunkSize);
    i.position.chunk.y += Math.floor(pos.y / chunkSize);
    i.position.position.x -= chunkSize * Math.floor(pos.x / chunkSize);
    i.position.position.y -= chunkSize * Math.floor(pos.y / chunkSize);
  }

  // if we go over a chunk boundary, loop to the other side
  if (i.position.chunk.x < 0 || i.position.chunk.x >= chunkDims
    || i.position.chunk.y < 0 || i.position.chunk.y >= chunkDims) {
    i.position.chunk.x -= (Math.floor(i.position.chunk.x / chunkDims) * chunkDims);
    i.position.chunk.y -= (Math.floor(i.position.chunk.y / chunkDims) * chunkDims);
  }
}

function getDistance(i1: Instance, i2: Instance) : Point2D {
  let pos = {} as Point2D;
  pos.x = i2.position.position.x;
  pos.y = i2.position.position.y;
  pos.x += (chunkSize * (i2.position.chunk.x - i1.position.chunk.x));
  pos.y += (chunkSize * (i2.position.chunk.y - i1.position.chunk.y));

  // chunks are consistent
  // subtract
  pos.x -= i1.position.position.x;
  pos.y -= i1.position.position.y;
  
  return pos;
}