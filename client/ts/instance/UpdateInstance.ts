import { chunkSize, Instance, Point2D } from "../../../instances/GameTypes";

// returns true if we cross past the end of our chunks
// lol
let startTime: number;

export function getOriginTime() {
  return startTime;
}

// server time - performance now
export function setUpdateOrigin(serverTime: number) {
  startTime = serverTime - performance.now() / 1000;
  console.log(startTime);
}

export function UpdateInstance(i: Instance, chunkDims: number) : boolean {
  let update = startTime + (performance.now() / 1000);
  let delta = update - i.last_delta;
  i.last_delta = update;

  // update position based on current velocity
  i.position.position.x += i.velocity.x * delta;
  i.position.position.y += i.velocity.y * delta;

  let pos = i.position.position;

  
  i.rotation += i.rotation_velocity * delta;
  return fixChunkOffset(i, chunkDims);
}

export function UpdateAndInterpolate(il: Instance, ip: Instance, chunkDims: number) {
  let delta = startTime + (performance.now() / 1000) - il.last_delta;
  let t = 1 - Math.pow(0.0001, delta);

  let wrap_local = UpdateInstance(il, chunkDims);
  let wrap_packt = UpdateInstance(ip, chunkDims);

  // both are updated
  // nudge il by the difference
  let posDist = getDistance(il, ip);
  
  // fix chunk boundary crossing if distance is massive
  if (posDist.x > (chunkSize / 2)) {
    posDist.x = posDist.x - (chunkSize * chunkDims);
  } else if (posDist.x < -(chunkSize / 2)) {
    posDist.x = posDist.x + (chunkSize * chunkDims);
  }

  // good money
  if (posDist.y > (chunkSize / 2)) {
    posDist.y = posDist.y - (chunkSize * chunkDims);
  } else if (posDist.y < -(chunkSize / 2)) {
    posDist.y = posDist.y + (chunkSize * chunkDims);
  }

  il.position.position.x += posDist.x * t;
  il.position.position.y += posDist.y * t;
  fixChunkOffset(il, chunkDims);

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

// returns true if we passed our chunk boundary
function fixChunkOffset(i: Instance, chunkDims: number) : boolean {
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
    return true;
  }

  return false;
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