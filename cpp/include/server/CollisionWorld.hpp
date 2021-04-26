#ifndef COLLISION_WORLD_H_
#define COLLISION_WORLD_H_

#include <Asteroid.hpp>
#include <Projectile.hpp>

#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace vasteroids {
namespace server {

/**
 *  The CollisionWorld ingests simulated components and computes collisions.
 */ 
class CollisionWorld {
 public:
  /**
   *  @param chunk_dims - number of chunks per dimension in game world
   */ 
  CollisionWorld(int chunk_dims);

  /**
   *  Adds an asteroid to this collisionworld.
   *  @param a - a pointer to an asteroid.
   */ 
  void AddAsteroid(const Asteroid& a);

  /**
   *  Adds a projectile to this collisionworld.
   *  @param p - a pointer to a projectile.
   */ 
  void AddProjectile(const Projectile& p);

  /**
   *  Handles collisions in game, destroying asteroids which are hit.
   *  @param deleted_insts - an output parameter for the IDs which are deleted -- id -> chunk
   *  @param new_asteroids - if a destroyed asteroid can spawn two more, this maps from its position to its radius.
   *  @returns mapping from ships to their locally destroyed projectiles.
   */ 
  std::unordered_map<uint64_t, std::unordered_set<uint32_t>> ComputeCollisions(std::unordered_map<uint64_t, Point2D<int>>& deleted_insts, std::vector<std::pair<WorldPosition, float>>& deleted_asteroids);
 
  /**
   *  Resets the contents of this collisionworld :sade:
   */ 
  void clear();
 private:
  void GetAsteroidBoundingBox(const Asteroid& a, Point2D<int>* min, Point2D<int>* max);
  float GetAsteroidRadius(const Asteroid& a);
  void AddToCollisionChunk(const Asteroid& a, Point2D<int> chunk);

  // places asteroids into chunks
  std::unordered_map<Point2D<int>, std::unordered_set<uint64_t>> asteroid_chunks_;
  // id -> asteroid
  std::unordered_map<uint64_t, Asteroid> asteroids_;
  // id -> projectile
  std::unordered_map<uint64_t, Projectile> projectiles_;

  const int chunk_count_;
};

}
}

#endif