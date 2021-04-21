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

bool Chunk::UpdateInstance(Instance* inst, std::chrono::time_point<std::chrono::high_resolution_clock>* cur) {
  auto delta_local = std::chrono::duration<float>(*cur - inst->last_update).count();
  inst->position.position += (inst->velocity * delta_local);
  inst->last_update = *cur;
  if (inst->position.position.x >= chunk_size || inst->position.position.y >= chunk_size
   || inst->position.position.x <           0 || inst->position.position.y <           0) {
    // add it to resid
    inst->position.chunk.x += static_cast<int>(std::floor(inst->position.position.x / chunk_size));
    inst->position.chunk.y += static_cast<int>(std::floor(inst->position.position.y / chunk_size));
    inst->position.position.x -= 128.0f * std::floor(inst->position.position.x / chunk_size);
    inst->position.position.y -= 128.0f * std::floor(inst->position.position.y / chunk_size);

    // don't handle chunk overflow yet
    std::cout << inst->position.chunk.x << ", " << inst->position.chunk.y << std::endl;
    std::cout << inst->position.position.x << ", " << inst->position.position.y << std::endl;
    return false;
  }

  std::cout << inst->position.chunk.x << ", " << inst->position.chunk.y << std::endl;
  std::cout << inst->position.position.x << ", " << inst->position.position.y << std::endl;
  return true;

}

void Chunk::UpdateChunk(ServerPacket& resid) {
  auto now_update = std::chrono::high_resolution_clock::now();

  {
    // update asteroids
    auto itr = asteroids_.begin();
    while (itr != asteroids_.end()) {
      if (!UpdateInstance(&itr->second, &now_update)) {
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
      if (!UpdateInstance(&itr->second, &now_update)) {
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