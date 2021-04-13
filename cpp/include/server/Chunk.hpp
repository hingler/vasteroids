#ifndef CHUNK_H_
#define CHUNK_H_

#include <chrono>
#include <unordered_map>

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
   *  @returns a copy of a locally stored ship, if one exists.
   */ 
  Ship* GetShip(uint64_t id);

  /**
   *  Inserts a ship into this chunk, or updates a ship if the corresponding ship is present.
   */ 
  void InsertShip(Ship& s);

  /**
   *  Inserts or updates an asteroid in this chunk.
   */ 
  void InsertAsteroid(Asteroid& a);

  /**
   *  Removes an instance from this chunk.
   *  @param id - the ID of the instance being removed.
   *  @returns true if the ID could be removed, false otherwise.
   */ 
  bool RemoveInstance(uint64_t id);

  /**
   *  @returns a floating point number representing the amount of activity in this chunk.
   */ 
  float GetActivity();

 private:
  std::unordered_map<uint64_t, Ship> ships_;
  std::unordered_map<uint64_t, Asteroid> asteroids_;

  // records time since this chunk was last updated.
  std::chrono::time_point<std::chrono::high_resolution_clock> last_update;
  

};

}
}

#endif