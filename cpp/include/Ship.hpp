#ifndef SHIP_H_
#define SHIP_H_

#include <GameTypes.hpp>

namespace vasteroids {

struct Ship : public Instance {
  std::string name;
  int64_t score;

  Ship();
  Ship(Napi::Object obj);

  Napi::Object ToNodeObject(Napi::Env env) const override;
};

}

#endif