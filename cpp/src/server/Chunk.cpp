#include <server/Chunk.hpp>
#include <GameTypes.hpp>

namespace vasteroids {
namespace server {

Chunk::Chunk() {
  last_update = std::chrono::high_resolution_clock::now();
};

void Chunk::InsertElements(const ServerPacket& insts) {
  contents.ConcatPacket(insts);
}

void Chunk::UpdateChunk(ServerPacket& resid) {
  // simulate all elements
  // if one ends up outside the chunk (coord < 0 or coord >= CHUNK_SIZE),
  // add it to resid.
  auto now_update = std::chrono::high_resolution_clock::now();
  float delta = std::chrono::duration<float>(now_update - last_update).count();
  // ensure we keep update time less than 1s (keep it safe :)
  delta = std::min(delta, 1.0f);
  {
    // update asteroids
    auto itr = contents.asteroids.begin();
    while (itr != contents.asteroids.end()) {
      itr->position.position += (itr->velocity * delta);
      if (itr->position.position.x >= chunk_size || itr->position.position.y >= chunk_size
       || itr->position.position.x <           0 || itr->position.position.y <           0) {
        // add it to resid
        resid.asteroids.push_back(*itr);
        itr = contents.asteroids.erase(itr);
      } else {
        itr++;
      }
    }
  }

  {
    // update ships -- note: we're going to update this for it.
    auto itr = contents.ships.begin();
    while (itr != contents.ships.end()) {
      itr->position.position += (itr->velocity * delta);
      if (itr->position.position.x >= chunk_size || itr->position.position.y >= chunk_size
       || itr->position.position.x <           0 || itr->position.position.y <           0) {
        // add it to resid
        resid.ships.push_back(*itr);
        itr = contents.ships.erase(itr);
      } else {
        itr++;
      }
    }
  }
}

void Chunk::GetContents(ServerPacket& resid) {
  resid.asteroids.insert(resid.asteroids.end(), contents.asteroids.begin(), contents.asteroids.end());
  resid.ships.insert(resid.ships.end(), contents.ships.begin(), contents.ships.end());
}

}
}