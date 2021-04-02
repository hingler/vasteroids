#include <Asteroid.hpp>

namespace vasteroids {

Asteroid Asteroid::FromNodeObject(Napi::Object obj) {
  Asteroid res;
  Napi::Env env = obj.Env();
  Napi::Value geom = obj.Get("geometry");
  if (geom.IsUndefined() || !geom.IsArray()) {
    // something is wrong
    Napi::TypeError::New(env, "'geometry' field of asteroid not present").ThrowAsJavaScriptException();
    return;
  }

  Napi::Array arr = geom.As<Napi::Array>();
  for (int i = 0; i < arr.Length(); i++) {
    Napi::Value val = arr[i];
    if (!val.IsObject()) {
      Napi::TypeError::New(env, "indices of 'geometry' field are not object").ThrowAsJavaScriptException();
    }

    Napi::Object pt = val.As<Napi::Object>();
    res.geometry.push_back(Point2D::FromNodeObject(pt));
  }

  Napi::Value pos = obj.Get("position");
  if (!pos.IsObject()) {
    Napi::TypeError::New(env, "'position' not present").ThrowAsJavaScriptException();
  }

  res.position = Point2D::FromNodeObject(pos.As<Napi::Object>());

  res.rotation = obj.Get("rotation").As<Napi::Number>().FloatValue();
  res.rotation_velocity = obj.Get("rotation_velocity").As<Napi::Number>().FloatValue();
  res.velocity = Point2D::FromNodeObject(obj.Get("velocity").As<Napi::Object>());
  return res;
}

Napi::Object Asteroid::AsNodeObject(Napi::Env env) {
  Napi::Object res = Napi::Object::New(env);
  Napi::Array arr = Napi::Array::New(env, geometry.size());
  
  int i = 0;
  for (const auto& point : this->geometry) {
    arr[i++] = point.NodeObjectFromPoint(env);
  }

  res.Set("geometry", arr);
  res.Set("rotation", rotation);
  res.Set("position", position.NodeObjectFromPoint(env));
  res.Set("velocity", velocity.NodeObjectFromPoint(env));
  res.Set("rotation_velocity", rotation_velocity);

  return res;
}

}
