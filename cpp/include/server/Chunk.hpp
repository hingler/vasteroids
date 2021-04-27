#ifndef CHUNK_H_
#define CHUNK_H_

#include <chrono>
#include <unordered_map>
#include <unordered_set>

#include <server/ServerPacket.hpp>

namespace vasteroids {
namespace server {

/**
 *  A chunk represents a "block" of space which contains several instances.
 */ 
class Chunk {
 public:
  Chunk(double creation_time);

  /**
   *  Inserts some set of elements into this chunk.
   */ 
  void InsertElements(const ServerPacket& contents);

  /**
   *  Simulates the content of this chunk.
   *  @param resid - accumulates instances which exit this chunk.
   *  @param server_time - the local server time at which this function is being called.
   */ 
  void UpdateChunk(ServerPacket& resid, double server_time);

  /**
   *  Fetches the contents of this chunk and appends them to the passed ServerPacket.
   *  @param resid - the server packet which we add this chunk's contents to.
   */ 
  void GetContents(ServerPacket& resid);

  Projectile* GetProjectile(uint64_t);

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
   *  Inserts or updates a projectile in this chunk.
   */ 
  void InsertProjectile(Projectile& p);

  /**
   *  Inserts a collision in this chunk.
   *  The collision, if unperturbed, will be deleted by the chunk once its life span comes to pass.
   */ 
  void InsertCollision(Collision& c);

  /**
   *  Removes a ship from a chunk -- does not record the instance as deleted.
   *  @param id - the ID of the ship we wish to move.
   */  
  bool MoveShip(uint64_t id);

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
  // updates the position of an instance, handling wrap around
  bool UpdateInstance(Instance* inst, double cur);

  std::unordered_map<uint64_t, Ship> ships_;
  std::unordered_map<uint64_t, Asteroid> asteroids_;
  std::unordered_map<uint64_t, Projectile> projectiles_;
  std::unordered_map<uint64_t, Collision> collisions_;

  // list of all items deleted since last update
  std::unordered_set<uint64_t> deleted_cur_;

  // list of all items deleted in the last update
  std::unordered_set<uint64_t> deleted_last_;

  double last_server_time_;
  // set to true when we want to update
  bool hard_update_;

  // when getting contents: chunks will append the set of all IDs deleted in the last update
  

};

}
}

#endif