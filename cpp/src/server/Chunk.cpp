#include <server/Chunk.hpp>
#include <GameTypes.hpp>

#include <cmath>

#define PROJECTILE_LIFESPAN 5.0
#define COLLISION_LIFESPAN 3.0

namespace vasteroids {
namespace server {

Chunk::Chunk(double creation_time) {
  last_server_time_ = creation_time;
};

void Chunk::InsertElements(const ServerPacket& insts) {
  for (auto& ship : insts.ships) {
    ships_.insert(std::make_pair(ship.id, ship));
  }

  for (auto& asteroid : insts.asteroids) {
    asteroids_.insert(std::make_pair(asteroid.id, asteroid));
  }

}

bool Chunk::UpdateInstance(Instance* inst, double cur) {
  if (static_cast<int>((inst->origin_time + cur) / 4) > static_cast<int>((inst->origin_time + inst->last_update) / 4)) {
    inst->ver++;
  }

  // max?
  // it might handle just fine right now :)
  float delta_local = static_cast<float>(std::min(cur - inst->last_update, 1.0));
  inst->position.position += (inst->velocity * delta_local);
  inst->rotation += (inst->rotation_velocity * delta_local);
  inst->last_update = cur;
  if (inst->position.position.x >= chunk_size || inst->position.position.y >= chunk_size
   || inst->position.position.x <           0 || inst->position.position.y <           0) {
    // add it to resid
    inst->position.chunk.x += static_cast<int>(std::floor(inst->position.position.x / chunk_size));
    inst->position.chunk.y += static_cast<int>(std::floor(inst->position.position.y / chunk_size));
    inst->position.position.x -= chunk_size * std::floor(inst->position.position.x / chunk_size);
    inst->position.position.y -= chunk_size * std::floor(inst->position.position.y / chunk_size);


    // don't handle chunk overflow yet
    return false;
  }

  return true;

}

void Chunk::UpdateChunk(ServerPacket& resid, double server_time) {
  // TODO: we want to keep components up to date
  //       ever second or so, increase the ver number so that we send a delta to the client

  // handle this per instance
  hard_update_ = static_cast<int>(server_time) > static_cast<int>(last_server_time_);
  last_server_time_ = server_time;

  {
    // update asteroids
    auto itr = asteroids_.begin();
    while (itr != asteroids_.end()) {
      if (!UpdateInstance(&itr->second, server_time)) {
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
      if (!UpdateInstance(&itr->second, server_time)) {
        resid.ships.push_back(itr->second);
        itr = ships_.erase(itr);
      } else {
        itr++;
      }
    }
  }

  {
    auto itr = projectiles_.begin();
    while (itr != projectiles_.end()) {
      bool exit = UpdateInstance(&itr->second, server_time);
      if (server_time - itr->second.creation_time > PROJECTILE_LIFESPAN) {
        // erase the projectile from existence
        deleted_cur_.insert(itr->second.id);
        itr = projectiles_.erase(itr);
      } else {
        if (!exit) {
          resid.projectiles.push_back(itr->second);
          itr = projectiles_.erase(itr);
        } else {
          itr++;
        }
      }
    }
  }

  {
    auto itr = collisions_.begin();
    // collisions don't move
    while (itr != collisions_.end()) {
      if (server_time - itr->second.creation_time > COLLISION_LIFESPAN) {
        deleted_cur_.insert(itr->second.id);
        std::cout << "deleted collision id " << itr->second.id << std::endl;
        itr = collisions_.erase(itr);
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

Projectile* Chunk::GetProjectile(uint64_t id) {
  auto itr = projectiles_.find(id);
  if (itr == projectiles_.end()) {
    return nullptr;
  }

  return &(itr->second);
}

void Chunk::InsertShip(Ship& s) {
  // if we're inserting into a chunk, then the object has just been updated.
  if (ships_.count(s.id)) {
    ships_.erase(s.id);
  }
  ships_.insert(std::make_pair(s.id, s));
}

void Chunk::InsertAsteroid(Asteroid& a) {
  asteroids_.insert(std::make_pair(a.id, a));
}

void Chunk::InsertProjectile(Projectile& p) {
  projectiles_.insert(std::make_pair(p.id, p));
}

void Chunk::InsertCollision(Collision& c) {
  std::cout << "added collision " << c.id << std::endl;
  collisions_.insert(std::make_pair(c.id, c));
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

  if (projectiles_.erase(id)) {
    deleted_cur_.insert(id);
    // handle local deletion
    return true;
  }

  if (collisions_.erase(id)) {
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

  for (auto& p : projectiles_) {
    resid.projectiles.push_back(p.second);
  }

  for (auto& c : collisions_) {
    resid.collisions.push_back(c.second);
  }

  for (auto& s : deleted_last_) {
    resid.deleted.insert(s);
  }
}

}
}