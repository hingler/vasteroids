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

  Napi::Value scoreObj = obj.Get("score");
  if (!scoreObj.IsNumber()) {
    TYPEERROR(env, "score field not present :(");
  }

  score = scoreObj.As<Napi::Number>().Int64Value();

  Napi::Value destroyedObj = obj.Get("destroyed");
  if (!destroyedObj.IsBoolean()) {
    TYPEERROR(env, "destroyed field not present :(");
  }

  destroyed = destroyedObj.As<Napi::Boolean>().Value();
}

Napi::Object Ship::ToNodeObject(Napi::Env env) const {
  Napi::Object res = Instance::ToNodeObject(env);
  res.Set("name", name);
  res.Set("score", score);
  res.Set("destroyed", destroyed);
  return res;
}

}