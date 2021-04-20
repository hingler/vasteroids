import { chunkSize, Instance } from "../../../instances/GameTypes";

export function UpdateInstance(i: Instance, chunkDims: number) {
  let update = performance.now() / 1000;
  let delta = update - i.last_delta;
  i.last_delta = update;

  // update position based on current velocity
  i.position.position.x += i.velocity.x * delta;
  i.position.position.y += i.velocity.y * delta;

  let pos = i.position.position;

  // adjust position if offset
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

  i.rotation += i.rotation_velocity * delta;
}