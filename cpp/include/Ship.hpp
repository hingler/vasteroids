#ifndef SHIP_H_
#define SHIP_H_

#include <GameTypes.hpp>

namespace vasteroids {

struct Ship : public Instance {
  std::string name;
  int64_t score;
  bool destroyed;
  int lives;

  Ship();
  Ship(Napi::Object obj);

  Napi::Object ToNodeObject(Napi::Env env) const override;
};

}

#endif