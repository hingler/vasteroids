#ifndef WORLD_SIM_H_
#define WORLD_SIM_H_

#include <GameTypes.hpp>
#include <server/Chunk.hpp>
#include <server/CollisionWorld.hpp>
#include <Projectile.hpp>

#include <server/BiomeManager.hpp>

#include <napi.h>

#include <memory>
#include <random>
#include <unordered_map>
#include <unordered_set>

namespace vasteroids {
namespace server {

// todo: handling out of bounds case?

class WorldSim : public Napi::ObjectWrap<WorldSim> {

 public:
  static Napi::Function GetClassInstance(Napi::Env env);
  /**
   *  Creates a new WorldSim instance.
   *  @param dim - the x/y size of the world, in # of chunks.
   */ 
  WorldSim(const Napi::CallbackInfo& info);

  Napi::Value GetChunkDims(const Napi::CallbackInfo& info);
  Napi::Value HandleClientPacket(const Napi::CallbackInfo& info);
  Napi::Value UpdateSim(const Napi::CallbackInfo& info);
  Napi::Value RespawnShip(const Napi::CallbackInfo& info);
  Napi::Value AddShip(const Napi::CallbackInfo& info);
  Napi::Value DeleteShip(const Napi::CallbackInfo& info);
  Napi::Value GetServerTime(const Napi::CallbackInfo& info);
  Napi::Value GetLocalBiomeInfo(const Napi::CallbackInfo& info);
  // Napi::Value GetLocalChunkActivity(const Napi::CallbackInfo& info);
 private:

  /**
   *  @returns a set of all chunks which need to be updated.
   */ 
  std::unordered_set<Point2D<int>> GetActiveChunks();

  /**
   *  Reinserts elements which fell outside of their respective chunk.
   *  @param collate - serverpacket containing all instances which need to be moved.
   */ 
  void ReinsertInstances(ServerPacket& collate);

  /**
   *  Sets the spawn coordinates for a new ship.
   *  @param s - reference to our new ship.
   */ 
  void SpawnShip(Ship& s);

  /**
   *  Corrects the position of a particular instance if its position/chunk are inconsistent with dims.
   *  @param inst - the inst being corrected.
   */ 
  void CorrectChunk(Instance& inst);

  // handles a single projectile (from a clientPacket)
  void HandleNewProjectile(uint64_t ship_id, Projectile& proj);

  // creates and populates a chunk.
  void CreateChunk(Point2D<int> chunk_coord);

  // generates a new asteroid at some worldposition and adds it to the world.
  void SpawnNewAsteroid(WorldPosition coord);

  // generates a new asteroid with a prespecified number of points and radius and adds it to the world.
  void SpawnNewAsteroid(WorldPosition coord, float radius, int points);

  // gets dist between two points
  Point2D<float> GetDistance(WorldPosition a, WorldPosition b);

  // corrects for chunk overflow
  void FixChunkBoundaries(Point2D<int>& chunk);

  double GetServerTime_();

  // x/y dims of our world
  int chunk_dims_;

  // number of asteroids in the world
  int asteroid_count_;
  int asteroid_min_;

  std::shared_ptr<CollisionWorld> cw_;

  // key: chunk coordinate -> chunk and all elements inside it
  std::unordered_map<Point2D<int>, Chunk> chunks_;

  // key: ship ID -> last known coordinates of that ship
  std::unordered_map<uint64_t, Point2D<int>> ships_;

  // key: ship ID -> last known ver for each instance
  std::unordered_map<uint64_t, std::unordered_map<uint64_t, uint32_t>> known_ids_;

  // key: ship ID -> newly generated projectiles which we need to report on
  std::unordered_map<uint64_t, std::unordered_set<uint64_t>> new_projectiles_;

  std::mt19937 gen;

  std::shared_ptr<BiomeManager> mgr;

  std::normal_distribution<> chunk_gen;
  std::uniform_real_distribution<float> coord_gen;
  std::uniform_real_distribution<float> velo_gen;

  // the time point at which the server was created
  std::chrono::time_point<std::chrono::high_resolution_clock> origin_time_;

  // keep it dumb :)
  uint64_t id_max_;


};

}
}

#endif