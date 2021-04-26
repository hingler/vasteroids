#include <server/ServerPacket.hpp>

namespace vasteroids {
namespace server {

void ServerPacket::ConcatPacket(const ServerPacket& packet) {
  // ignore server time
  asteroids.insert(asteroids.end(), packet.asteroids.begin(), packet.asteroids.end());
  ships.insert(ships.end(), packet.ships.begin(), packet.ships.end());
}

Napi::Object ServerPacket::ToNodeObject(Napi::Env env) {
  Napi::Object obj = Napi::Object::New(env);

  {
    Napi::Array instance_arr = Napi::Array::New(env);
    uint32_t i = 0;
    for (const auto& asteroid : asteroids) {
      instance_arr[i++] = asteroid.ToNodeObject(env);
    }

    obj.Set("asteroids", instance_arr);
  }

  {
    Napi::Array instance_arr = Napi::Array::New(env);
    uint32_t i = 0;
    for (const auto& ship : ships) {
      instance_arr[i++] = ship.ToNodeObject(env);
    }

    obj.Set("ships", instance_arr);
  }

  {
    Napi::Array instance_arr = Napi::Array::New(env);
    uint32_t i = 0;
    for (const auto& proj : projectiles) {
      instance_arr[i++] = proj.ToNodeObject(env);
    }

    obj.Set("projectiles", instance_arr);
  }

  {
    Napi::Array instance_arr = Napi::Array::New(env);
    uint32_t i = 0;
    for (const auto& proj : projectiles_local) {
      instance_arr[i++] = proj.ToNodeObject(env);
    }

    obj.Set("projectilesLocal", instance_arr);
  }

  {
    Napi::Array instance_arr = Napi::Array::New(env);
    uint32_t i = 0;
    for (const auto& delta : deltas) {
      instance_arr[i++] = delta.ToNodeObject(env);
    }

    obj.Set("deltas", instance_arr);
  }
  
  {
    Napi::Array deleted_nums = Napi::Array::New(env);
    uint64_t i = 0;
    for (const auto& del : deleted) {
      deleted_nums[i++] = Napi::Number::New(env, del);
    }

    obj.Set("deleted", deleted_nums);
  }

  {
    Napi::Array deleted_nums = Napi::Array::New(env);
    uint64_t i = 0;
    for (const auto& del : deleted_local) {
      deleted_nums[i++] = Napi::Number::New(env, del);
    }

    obj.Set("deletedLocal", deleted_nums);
  }

  {
    Napi::Number time = Napi::Number::New(env, server_time);
    obj.Set("serverTime", time);
  }

  return obj;
  
}

}
}