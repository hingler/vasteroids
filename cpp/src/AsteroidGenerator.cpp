#include <AsteroidGenerator.hpp>
#include <cinttypes>
#include <cstdlib>

#define PI 3.1415926535897932384626

namespace vasteroids {

Asteroid GenerateAsteroid(float radius, int32_t points) {
  Asteroid res;
  Point2D temp;

  double r, theta;
  for (int32_t i = 0; i < points; i++) {
    theta = i * PI * (2.0 / points);
    // 0.33 - 1.0
    r = (((rand() % 256) + 128) / 384.0) * radius;
    temp.x = static_cast<float>(cos(theta) * r);
    temp.y = static_cast<float>(sin(theta) * r);
    res.geometry.push_back(temp);
  }

  res.rotation = 0.0f;
  res.rotation_velocity = 0.0f;
  res.velocity = {0.0f, 0.0f};
  res.position = {0.0f, 0.0f};
  return res;
}

#ifdef ASTEROIDS_TEST
static Napi::Value GenerateAsteroidNode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  float radius = info[0].As<Napi::Number>().FloatValue();
  int32_t points = info[1].As<Napi::Number>().Int32Value();
  Asteroid a = GenerateAsteroid(radius, points);

  return a.AsNodeObject(env);
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("generateAsteroid", Napi::Function::New(env, GenerateAsteroidNode));
  return exports;
}

NODE_API_MODULE(asteroidGenerator, Init);
#endif

}
