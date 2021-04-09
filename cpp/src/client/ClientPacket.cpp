#include <client/ClientPacket.hpp>

namespace vasteroids {
namespace client {

ClientPacket::ClientPacket(Napi::Object obj) {
  Napi::Env env = obj.Env();
  Napi::Value shipObj = obj.Get("ship");

  if (!shipObj.IsObject()) {
    TYPEERROR(env, "Property 'ship' not found on object");
  }

  client_ship = Ship(shipObj.As<Napi::Object>());

  Napi::Value fireObj = obj.Get("projectileFired");
  if (!fireObj.IsBoolean()) {
    TYPEERROR(env, "Property 'projectileFired' not found on object");
  }

  projectile_fired = fireObj.As<Napi::Boolean>().Value();
}

}
}