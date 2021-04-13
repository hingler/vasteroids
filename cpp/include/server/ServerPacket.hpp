#ifndef SERVER_PACKET_H_
#define SERVER_PACKET_H_

#include <Asteroid.hpp>
#include <Ship.hpp>
#include <GameTypes.hpp>
#include <vector>

namespace vasteroids {
namespace server {
struct ServerPacket {
  // update information wrt asteroids
  std::vector<Asteroid> asteroids;

  // update information wrt ships
  std::vector<Ship> ships;

  // deltas which do not require complete information
  std::vector<Instance> deltas;

  /**
   *  Concatenates another server packet onto this one.
   */ 
  void ConcatPacket(const ServerPacket& packet);

  /**
   *  Converts a ServerPacket to a Node object.
   */ 
  Napi::Object ToNodeObject(Napi::Env env);
};
}
}

#endif