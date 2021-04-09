#ifndef CLIENT_PACKET_H_
#define CLIENT_PACKET_H_

#include <Ship.hpp>
#include <GameTypes.hpp>

namespace vasteroids {
namespace client {

struct ClientPacket {
  Ship client_ship;
  bool projectile_fired;

  ClientPacket() {}
  ClientPacket(Napi::Object obj);

  Napi::Object ToNodeObject() const;
};

}
}

#endif