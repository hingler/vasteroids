#include <GameTypes.hpp>

#define TYPEERROR(env, x) Napi::TypeError::New(env, x).ThrowAsJavaScriptException()

namespace vasteroids {

Napi::Object WorldPosition::ToNodeObject(Napi::Env env) const {
  Napi::Object res = Napi::Object::New(env);
  res.Set("chunk", chunk.ToNodeObject(env));
  res.Set("position", position.ToNodeObject(env));
  return res;
}

WorldPosition WorldPosition::FromNodeObject(Napi::Object obj) {
  WorldPosition res;

  Napi::Env env = obj.Env();
  Napi::Value chunkObj = obj.Get("chunk");
  if (!chunkObj.IsObject()) {
    TYPEERROR(env, "no point2d 'chunk' field on provided object");
  }

  res.chunk = Point2D<int>::FromNodeObject(chunkObj.As<Napi::Object>());

  Napi::Value posObj = obj.Get("position");
  if (!posObj.IsObject()) {
    TYPEERROR(env, "no point2d 'position' field on provided object");
  }

  res.position = Point2D<float>::FromNodeObject(posObj.As<Napi::Object>());
  return res;
}

Napi::Object Instance::ToNodeObject(Napi::Env env) const {
  Napi::Object res = Napi::Object::New(env);
  res.Set("position", position.ToNodeObject(env));
  res.Set("velocity", velocity.ToNodeObject(env));
  res.Set("rotation", Napi::Number::New(env, rotation));
  res.Set("rotation_velocity", Napi::Number::New(env, rotation_velocity));

  return res;
}

Instance Instance::FromNodeObject(Napi::Object obj) {
  Instance res;

  Napi::Env env = obj.Env();
  Napi::Value posObj = obj.Get("position");
  if (!posObj.IsObject()) {
    TYPEERROR(env, "no worldposition 'position' on provided object");
  }

  res.position = WorldPosition::FromNodeObject(posObj.As<Napi::Object>());
  
  Napi::Value velObj = obj.Get("velocity");
  if (!velObj.IsObject()) {
    TYPEERROR(env, "no point2d 'velocity' on provided object");
  }

  res.velocity = Point2D<float>::FromNodeObject(velObj.As<Napi::Object>());

  Napi::Value rotation = obj.Get("rotation");
  if (!rotation.IsNumber()) {
    TYPEERROR(env, "rotation field is missing");
  }

  res.rotation = rotation.As<Napi::Number>().FloatValue();

  Napi::Value rot_velo = obj.Get("rotation_velocity");
  if (!rot_velo.IsNumber()) {
    TYPEERROR(env, "rotation_velocity field is missing");
  }

  res.rotation_velocity = rot_velo.As<Napi::Number>().FloatValue();

  return res;
}

}