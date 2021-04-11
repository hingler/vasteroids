#ifndef WORLD_SIM_H_
#define WORLD_SIM_H_

#include <GameTypes.hpp>
#include <server/Chunk.hpp>

#include <napi.h>

#include <unordered_map>

namespace vasteroids {
namespace server {

// todo: handling out of bounds case?

class WorldSim : public Napi::ObjectWrap<WorldSim> {

 public:
  /**
   * 
   */ 
  static Napi::Object GetClassInstance(Napi::Env env, Napi::Object exports);
  /**
   *  Creates a new WorldSim instance.
   *  @param dim - the x/y size of the world, in # of chunks.
   */ 
  WorldSim(const Napi::CallbackInfo& info);

  Napi::Value GetChunkDims(Napi::CallbackInfo& info);
  Napi::Value HandleClientPacket(Napi::CallbackInfo& info);
  Napi::Value GetLocalChunkActivity(Napi::CallbackInfo& info);
 private:
  // creates and populates a chunk.
  void CreateChunk(Point2D<int> chunk_coord);
  std::unordered_map<Point2D<int>, Chunk> chunks_;
  // x/y dims of our world
  int chunk_dims_;

};

}
}

#endif