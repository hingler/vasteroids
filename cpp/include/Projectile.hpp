#ifndef PROJECTILE_H_

#include <napi.h>

#include <GameTypes.hpp>

namespace vasteroids {

struct Projectile : public Instance {
  Projectile();
  Projectile(Napi::Object obj);

  Napi::Object ToNodeObject(Napi::Env env) const;

  // the server time at which this projectile was created
  float creation_time;

  // uniquely identifies projectile on client side
  uint32_t client_ID;
};

}

#endif