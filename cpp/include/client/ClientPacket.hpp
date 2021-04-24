#ifndef CLIENT_PACKET_H_
#define CLIENT_PACKET_H_

#include <Ship.hpp>
#include <GameTypes.hpp>

#include <Projectile.hpp>

namespace vasteroids {
namespace client {

struct ClientPacket {
  Ship client_ship;
  std::vector<Projectile> projectiles;

  ClientPacket() {}
  ClientPacket(Napi::Object obj);
};

}
}

#endif