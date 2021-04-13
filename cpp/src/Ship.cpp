#include <Ship.hpp>

namespace vasteroids {

Ship::Ship() : Instance() {}

Ship::Ship(Napi::Object obj) : Instance(obj) {
  Napi::Env env = obj.Env();
  Napi::Value nameObj = obj.Get("name");
  if (!nameObj.IsString()) {
    TYPEERROR(env, "string field not present on ship");
  }

  name = nameObj.As<Napi::String>().Utf8Value(); 
}

Napi::Object Ship::ToNodeObject(Napi::Env env) const {
  Napi::Object res = Instance::ToNodeObject(env);
  res.Set("name", name);
  return res;
}

}