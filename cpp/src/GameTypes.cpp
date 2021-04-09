#include <GameTypes.hpp>

namespace vasteroids {

Napi::Object WorldPosition::ToNodeObject(Napi::Env env) const {
  Napi::Object res = Napi::Object::New(env);
  res.Set("chunk", chunk.ToNodeObject(env));
  res.Set("position", position.ToNodeObject(env));
  return res;
}

WorldPosition::WorldPosition(Napi::Object obj) {
  Napi::Env env = obj.Env();
  Napi::Value chunkObj = obj.Get("chunk");
  if (!chunkObj.IsObject()) {
    TYPEERROR(env, "no point2d 'chunk' field on provided object");
  }

  chunk = Point2D<int>(chunkObj.As<Napi::Object>());

  Napi::Value posObj = obj.Get("position");
  if (!posObj.IsObject()) {
    TYPEERROR(env, "no point2d 'position' field on provided object");
  }

  position = Point2D<float>(posObj.As<Napi::Object>());
}

Instance::Instance(Napi::Object obj) {
  Napi::Env env = obj.Env();
  Napi::Value posObj = obj.Get("position");
  if (!posObj.IsObject()) {
    TYPEERROR(env, "no worldposition 'position' on provided object");
  }

  position = WorldPosition(posObj.As<Napi::Object>());
  
  Napi::Value velObj = obj.Get("velocity");
  if (!velObj.IsObject()) {
    TYPEERROR(env, "no point2d 'velocity' on provided object");
  }

  velocity = Point2D<float>(velObj.As<Napi::Object>());

  Napi::Value rotObj = obj.Get("rotation");
  if (!rotObj.IsNumber()) {
    TYPEERROR(env, "rotation field is missing");
  }

  rotation = rotObj.As<Napi::Number>().FloatValue();

  Napi::Value rot_velo = obj.Get("rotation_velocity");
  if (!rot_velo.IsNumber()) {
    TYPEERROR(env, "rotation_velocity field is missing");
  }

  rotation_velocity = rot_velo.As<Napi::Number>().FloatValue();
}

Napi::Object Instance::ToNodeObject(Napi::Env env) const {
  Napi::Object res = Napi::Object::New(env);
  res.Set("position", position.ToNodeObject(env));
  res.Set("velocity", velocity.ToNodeObject(env));
  res.Set("rotation", Napi::Number::New(env, rotation));
  res.Set("rotation_velocity", Napi::Number::New(env, rotation_velocity));

  return res;
}

}