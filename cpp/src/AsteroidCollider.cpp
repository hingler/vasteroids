#include <AsteroidCollider.hpp>

#define PI 3.1415926535897932384626

namespace vasteroids {

bool Collide(const Asteroid& asteroid, const Point2D& point) {
  float wind_distance = 0.0f;
  float theta_last, delta_theta;
  Point2D point_rel = (point - asteroid.position);
  Point2D delta = asteroid.geometry[asteroid.geometry.size() - 1] - point_rel;
  theta_last = atan2(delta.y, delta.x);
  for (int i = 0; i < asteroid.geometry.size(); i++) {
    delta = asteroid.geometry[i] - point_rel;
    delta_theta = atan2(delta.y, delta.x) - theta_last;
    if (delta_theta > PI) {
      delta_theta = delta_theta - (2 * PI);
    } else if (delta_theta < -PI) {
      delta_theta = (2 * PI) + delta_theta;
    }

    wind_distance += delta_theta;
    theta_last = atan2(delta.y, delta.x);
  }

  if (wind_distance > PI) {
    return true;
  }

  return false;
}

#ifdef COLLIDER_TEST

static Napi::Value CollideNode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Bad args").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Object asteroid = info[0].As<Napi::Object>();
  Napi::Object point = info[1].As<Napi::Object>();

  Asteroid a = Asteroid::FromNodeObject(asteroid);
  Point2D c = Point2D::FromNodeObject(point);
  Napi::Boolean ret(env, Collide(a, c));

  return ret;
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("collide", Napi::Function::New(env, CollideNode));
  return exports;
}

NODE_API_MODULE(asteroidCollider, Init);

#endif

}