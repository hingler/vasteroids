#ifndef PROJECTILE_H_
#define PROJECTILE_H_

#include <napi.h>

#include <GameTypes.hpp>

namespace vasteroids {

struct Projectile : public Instance {
  Projectile() {}
  Projectile(Napi::Object obj);

  Napi::Object ToNodeObject(Napi::Env env) const;

  // uniquely identifies projectile on client side
  uint32_t client_ID;

  // CPP ONLY: id of the ship that created this projectile
  uint64_t ship_ID;

  // CPP ONLY: used to delete projectiles that have overstayed their welcome
  double creation_time;
};

}

#endif