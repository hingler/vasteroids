#include <server/CollisionWorld.hpp>
#include <AsteroidCollider.hpp>
#include <AsteroidGenerator.hpp>

#include <cmath>

namespace vasteroids {
namespace server {

CollisionWorld::CollisionWorld(int chunk_dims) : chunk_count_(chunk_dims) {}

void CollisionWorld::AddAsteroid(const Asteroid& a) {
  asteroids_.insert(std::make_pair(a.id, a));
  Point2D<int> min, max;
  GetAsteroidBoundingBox(a, &min, &max);
  // round down lower bound to floor
  // round up upper bound to ceil
  for (int i = min.x; i < max.x; i++) {
    for (int j = min.y; j < max.y; j++) {
      Point2D<int> chunk_add;
      // i or j might be greater than boundary, or less than 0
      // account for this by rounding back
      // collision func will handle the wrap, this just ensures the collision is considered properly
      chunk_add.x = (i + static_cast<int>(chunk_count_ * chunk_size)) % static_cast<int>(chunk_count_ * chunk_size);
      chunk_add.y = (j + static_cast<int>(chunk_count_ * chunk_size)) % static_cast<int>(chunk_count_ * chunk_size); 
      AddToCollisionChunk(a, chunk_add);
    }
  }
}

void CollisionWorld::AddProjectile(const Projectile& p) {
  projectiles_.insert(std::make_pair(p.id, p));
}

std::unordered_map<uint64_t, std::unordered_set<uint32_t>> CollisionWorld::ComputeCollisions(std::unordered_map<uint64_t, Point2D<int>>& deleted_insts, std::vector<std::pair<WorldPosition, float>>& deleted_asteroids) {
  // for each projectile:
  // see if its chunk has asteroids
  // test it against each asteroid, breaking if it gets a hit
  std::unordered_map<uint64_t, std::unordered_set<uint32_t>> res;
  Point2D<int> chunk;
  for (auto& proj : projectiles_) {
    chunk.x = static_cast<int>(proj.second.position.chunk.x * chunk_size + proj.second.position.position.x);
    chunk.y = static_cast<int>(proj.second.position.chunk.y * chunk_size + proj.second.position.position.y);
    if (!asteroid_chunks_.count(chunk)) {
      continue;
    }
    
    auto& contents = asteroid_chunks_.at(chunk);
    for (auto& id : contents) {
      if (!asteroids_.count(id)) {
        std::cout << "what the fuck" << std::endl;
        std::cout << "asteroid stored in chunk was not retained" << std::endl;
        continue;
      }

      Asteroid& ast = asteroids_.at(id);
      if (Collide(ast, proj.second.position, chunk_count_)) {
        // add the hit asteroid to our deleted IDs
        deleted_insts.insert(std::make_pair(ast.id, ast.position.chunk));
        // add the projectile to our deleted IDs as well
        deleted_insts.insert(std::make_pair(proj.second.id, proj.second.position.chunk));
        uint64_t ship_id = proj.second.ship_ID;
        if (!res.count(ship_id)) {
          res.insert(std::make_pair(ship_id, std::unordered_set<uint32_t>()));
        }

        res.at(ship_id).insert(proj.second.client_ID);
        //  - get radius as max (radius) of all points in the asteroid
        float radius = GetAsteroidRadius(ast);
        radius *= 0.707f;
        //  - if the radius is below some threshold, don't generate two new
        if (radius >= 0.25) {
          deleted_asteroids.push_back(std::make_pair(ast.position, radius));
        }
      }
    }
  }
  return res;
}


void CollisionWorld::clear() {
  asteroid_chunks_.clear();
  asteroids_.clear();
  projectiles_.clear();
}

void CollisionWorld::GetAsteroidBoundingBox(const Asteroid& a, Point2D<int>* min, Point2D<int>* max) {
  Point2D<double> center(
    static_cast<double>(a.position.chunk.x) * chunk_size + static_cast<double>(a.position.position.x),
    static_cast<double>(a.position.chunk.y) * chunk_size + static_cast<double>(a.position.position.y));

  float rs = sin(a.rotation);
  float rc = cos(a.rotation);

  // this owrks now :)
  Point2D<double> bb_min = center, bb_max = center;
  double geom_x, geom_y;
  for (auto& point : a.geometry) {
    geom_x = static_cast<double>(point.x * rc + point.y * rs + center.x);
    geom_y = static_cast<double>(point.x * -rs + point.y * rc + center.y);
    bb_min.x = std::min(bb_min.x, geom_x);
    bb_min.y = std::min(bb_min.y, geom_y);
    bb_max.x = std::max(bb_max.x, geom_x);
    bb_max.y = std::max(bb_max.y, geom_y);
  }

  // round truncates
  min->x = static_cast<int>(bb_min.x);
  if (bb_min.x < 0) {
    // floor behavior vs. truncation towards 0
    min->x--;
  }

  min->y = static_cast<int>(bb_min.y);
  if (bb_min.y < 0) {
    min->y--;
  }
  
  // will never be < 0 -- so no problem :)
  max->x = static_cast<int>(bb_max.x + 1);
  max->y = static_cast<int>(bb_max.y + 1);
}

float CollisionWorld::GetAsteroidRadius(const Asteroid& a) {
  double max_radius = 0;
  for (auto& p : a.geometry) {
    max_radius = std::max(max_radius, static_cast<double>(p.x * p.x + p.y * p.y));
  }

  return static_cast<double>(sqrt(max_radius));
}

void CollisionWorld::AddToCollisionChunk(const Asteroid& a, Point2D<int> chunk) {
  if (!asteroid_chunks_.count(chunk)) {
    asteroid_chunks_.insert(std::make_pair(chunk, std::unordered_set<uint64_t>()));
  }

  asteroid_chunks_.at(chunk).insert(a.id);
}

}
}