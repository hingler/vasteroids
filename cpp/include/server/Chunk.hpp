#ifndef CHUNK_H_
#define CHUNK_H_

#include <chrono>
#include <server/ServerPacket.hpp>

namespace vasteroids {
namespace server {

/**
 *  A chunk represents a "block" of space which contains several instances.
 */ 
class Chunk {
 public:
  Chunk();

  /**
   *  Inserts some set of elements into this chunk.
   */ 
  void InsertElements(const ServerPacket& contents);

  /**
   *  Simulates the content of this chunk.
   *  @param resid - accumulates instances which exit this chunk.
   */ 
  void UpdateChunk(ServerPacket& resid);

  /**
   *  Fetches the contents of this chunk and appends them to the passed ServerPacket.
   *  @param resid - the server packet which we add this chunk's contents to.
   */ 
  void GetContents(ServerPacket& resid);

  /**
   *  @returns a floating point number representing the amount of activity in this chunk.
   */ 
  float GetActivity();

 private:
  // stores contents of this chunk.
  ServerPacket contents;

  // records time since this chunk was last updated.
  std::chrono::time_point<std::chrono::high_resolution_clock> last_update;
  

};

}
}

#endif