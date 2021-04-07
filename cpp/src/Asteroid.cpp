#include <Asteroid.hpp>

namespace vasteroids {

Asteroid Asteroid::FromNodeObject(Napi::Object obj) {
  Asteroid res;
  Napi::Env env = obj.Env();

  dynamic_cast<Instance&>(res) = Instance::FromNodeObject(obj);

  Napi::Value geom = obj.Get("geometry");
  if (geom.IsUndefined() || !geom.IsArray()) {
    // something is wrong
    Napi::TypeError::New(env, "'geometry' field of asteroid not present").ThrowAsJavaScriptException();
    return res;
  }

  Napi::Array arr = geom.As<Napi::Array>();
  for (uint32_t i = 0; i < arr.Length(); i++) {
    Napi::Value val = arr[i];
    if (!val.IsObject()) {
      Napi::TypeError::New(env, "indices of 'geometry' field are not object").ThrowAsJavaScriptException();
    }

    Napi::Object pt = val.As<Napi::Object>();
    res.geometry.push_back(Point2D<float>::FromNodeObject(pt));
  }

  return res;
}

Napi::Object Asteroid::ToNodeObject(Napi::Env env) {
  Napi::Object res = Instance::ToNodeObject(env);
  Napi::Array arr = Napi::Array::New(env, geometry.size());
  
  int i = 0;
  for (const auto& point : this->geometry) {
    arr[i++] = point.ToNodeObject(env);
  }

  res.Set("geometry", arr);

  return res;
}

}
