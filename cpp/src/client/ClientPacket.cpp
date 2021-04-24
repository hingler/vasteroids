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

  Napi::Value proj = obj.Get("projectiles");
  if (!proj.IsArray()) {
    TYPEERROR(env, "Property 'projectiles' not found on object");
  }

  Napi::Array proj_array = proj.As<Napi::Array>();
  for (uint32_t i = 0; i < proj_array.Length(); i++) {
    Napi::Value proj = proj_array[i];
    if (!proj.IsObject()) {
      TYPEERROR(env, "Contents of projectile array are not projectiles!");
    }

    projectiles.push_back(Projectile(proj.As<Napi::Object>()));
  }
}

}
}