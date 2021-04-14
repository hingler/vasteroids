#include <server/Chunk.hpp>
#include <GameTypes.hpp>

namespace vasteroids {
namespace server {

Chunk::Chunk() {
  last_update = std::chrono::high_resolution_clock::now();
};

void Chunk::InsertElements(const ServerPacket& insts) {
  for (auto& ship : insts.ships) {
    ships_.insert(std::make_pair(ship.id, ship));
  }

  for (auto& asteroid : insts.asteroids) {
    asteroids_.insert(std::make_pair(asteroid.id, asteroid));
  }

}

void Chunk::UpdateChunk(ServerPacket& resid) {
  // simulate all elements
  // if one ends up outside the chunk (coord < 0 or coord >= CHUNK_SIZE),
  // add it to resid.
  auto now_update = std::chrono::high_resolution_clock::now();
  float delta = std::chrono::duration<float, std::ratio<1L, 1L>>(now_update - last_update).count();
  // ensure we keep update time less than 1s (keep it safe :)
  delta = std::min(delta, 1.0f);
  {
    // update asteroids
    auto itr = asteroids_.begin();
    while (itr != asteroids_.end()) {
      auto delta_local = std::chrono::duration<float>(now_update - itr->second.last_update).count();
      itr->second.position.position += (itr->second.velocity * delta_local);
      itr->second.last_update = now_update;
      if (itr->second.position.position.x >= chunk_size || itr->second.position.position.y >= chunk_size
       || itr->second.position.position.x <           0 || itr->second.position.position.y <           0) {
        // add it to resid
        itr->second.position.chunk.x += static_cast<int>(std::floor(itr->second.position.position.x / chunk_size));
        itr->second.position.chunk.y += static_cast<int>(std::floor(itr->second.position.position.y / chunk_size));
        itr->second.position.position.x -= 128.0f * std::floor(itr->second.position.position.x / chunk_size);
        itr->second.position.position.y -= 128.0f * std::floor(itr->second.position.position.y / chunk_size);
        resid.asteroids.push_back(itr->second);
        itr = asteroids_.erase(itr);
      } else {
        itr++;
      }
    }
  }

  {
    // update ships -- note: we're going to update this for it.
    auto itr = ships_.begin();
    while (itr != ships_.end()) {
      auto delta_local = std::chrono::duration<float>(now_update - itr->second.last_update).count();
      itr->second.position.position += (itr->second.velocity * delta_local);
      itr->second.last_update = now_update;
      if (itr->second.position.position.x >= chunk_size || itr->second.position.position.y >= chunk_size
       || itr->second.position.position.x <           0 || itr->second.position.position.y <           0) {
        // add it to resid
        // make chunks consistent
        itr->second.position.chunk.x += static_cast<int>(std::floor(itr->second.position.position.x / chunk_size));
        itr->second.position.chunk.y += static_cast<int>(std::floor(itr->second.position.position.y / chunk_size));
        itr->second.position.position.x -= 128.0f * std::floor(itr->second.position.position.x / chunk_size);
        itr->second.position.position.y -= 128.0f * std::floor(itr->second.position.position.y / chunk_size);
        resid.ships.push_back(itr->second);
        itr = ships_.erase(itr);
      } else {
        itr++;
      }
    }
  }

  deleted_last_ = std::move(deleted_cur_);
  deleted_cur_ = std::unordered_set<uint64_t>();
}

Ship* Chunk::GetShip(uint64_t id) {
  auto itr = ships_.find(id);
  if (itr == ships_.end()) {
    return nullptr;
  }

  return &(itr->second);
}

void Chunk::InsertShip(Ship& s) {
  // if we're inserting into a chunk, then the object has just been updated.
  s.last_update = std::chrono::high_resolution_clock::now();
  ships_.insert(std::make_pair(s.id, s));
}

void Chunk::InsertAsteroid(Asteroid& a) {
  a.last_update = std::chrono::high_resolution_clock::now();
  asteroids_.insert(std::make_pair(a.id, a));
}

bool Chunk::MoveShip(uint64_t id) {
  if (ships_.erase(id)) {
    return true;
  }

  return false;
}

bool Chunk::RemoveInstance(uint64_t id) {
  if (ships_.erase(id)) {
    deleted_cur_.insert(id);
    return true;
  }

  if (asteroids_.erase(id)) {
    deleted_cur_.insert(id);
    return true;
  }

  return false;
}

void Chunk::GetContents(ServerPacket& resid) {
  for (auto& a : asteroids_) {
    resid.asteroids.push_back(a.second);
  }

  for (auto& s : ships_) {
    resid.ships.push_back(s.second);
  }

  for (auto& s : deleted_last_) {
    resid.deleted.insert(s);
  }
}

}
}