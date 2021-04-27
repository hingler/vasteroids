#ifndef COLLISION_H_
#define COLLISION_H_

#include <GameTypes.hpp>

namespace vasteroids {

struct Collision : public Instance {
  double creation_time;

  Collision() {}
  Collision(Napi::Object obj) : Instance(obj) {
    Napi::Env env = obj.Env();
    Napi::Value time = obj.Get("creationTime");
    if (!time.IsNumber()) {
      TYPEERROR(env, "time field missing!");
    }

    creation_time = time.As<Napi::Number>().DoubleValue();
  }

  Napi::Object ToNodeObject(Napi::Env env) const override {
    Napi::Object res = Instance::ToNodeObject(env);
    res.Set("creationTime", creation_time);
    return res;
  }
};

}

#endif