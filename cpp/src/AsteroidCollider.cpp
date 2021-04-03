#include <AsteroidCollider.hpp>

#include <iostream>

#define PI 3.1415926535897932384626

namespace vasteroids {

bool Collide(const Asteroid& asteroid, const Point2D& point) {
  float wind_distance = 0.0f;
  float theta_last, delta_theta;
  Point2D point_rel = (point - asteroid.position);
  // transform point based on rotation
  float rot_cos = cos(-asteroid.rotation);
  float rot_sin = sin(-asteroid.rotation);
  // point_rel is relative to asteroid center, but not rotated to account for asteroid's rotation.
  point_rel = { (point_rel.x * rot_cos) + (point_rel.y * rot_sin),
                (point_rel.x * -rot_sin) + (point_rel.y * rot_cos) };
  Point2D delta = asteroid.geometry[asteroid.geometry.size() - 1] - point_rel;
  theta_last = atan2(delta.y, delta.x);
  for (int i = 0; i < asteroid.geometry.size(); i++) {
    delta = asteroid.geometry[i] - point_rel;
    delta_theta = atan2(delta.y, delta.x) - theta_last;
    // std::cout << "delta before: " << delta_theta << " -- ";
    if (delta_theta > PI) {
      delta_theta = delta_theta - (2 * PI);
    } else if (delta_theta < -PI) {
      delta_theta = (2 * PI) + delta_theta;
    }

    // std::cout << "delta after: " << delta_theta << std::endl;

    wind_distance += delta_theta;
    theta_last = atan2(delta.y, delta.x);
  }

  if (wind_distance > PI || wind_distance < -PI) {
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
  Napi::Boolean ret = Napi::Boolean::New(env, Collide(a, c));

  return ret;
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("collide", Napi::Function::New(env, CollideNode));
  return exports;
}

NODE_API_MODULE(collidertest, Init);

#endif

}