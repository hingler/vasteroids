import { chunkSize, Instance } from "../../../instances/GameTypes";

export function UpdateInstance(i: Instance) {
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

  i.rotation += i.rotation_velocity * delta;
}