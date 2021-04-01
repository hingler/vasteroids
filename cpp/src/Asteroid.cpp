#include <Asteroid.hpp>

namespace vasteroids {

Napi::Object Asteroid::AsNodeObject(Napi::Env env) {
  Napi::Object res = Napi::Object::New(env);
  Napi::Array arr = Napi::Array::New(env, geometry.size());
  
  int i = 0;
  for (const auto& point : this->geometry) {
    arr[i++] = point.NodeObjectFromPoint(env);
  }

  res.Set("geometry", arr);
  res.Set("rotation", rotation);
  res.Set("velocity", velocity.NodeObjectFromPoint(env));
  res.Set("rotation_velocity", rotation_velocity);

  return res;
}

}
