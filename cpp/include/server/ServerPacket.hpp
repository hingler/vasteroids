#ifndef SERVER_PACKET_H_
#define SERVER_PACKET_H_

#include <Asteroid.hpp>
#include <Ship.hpp>
#include <GameTypes.hpp>
#include <vector>

namespace vasteroids {

struct ServerPacket {
  // update information wrt asteroids
  std::vector<Asteroid> asteroids;

  // update information wrt ships
  std::vector<Ship> ships;

  /**
   *  Converts a ServerPacket to a Node object.
   */ 
  Napi::Object ToNodeObject(Napi::Env env);
};

}

#endif