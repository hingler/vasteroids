#include <AsteroidCollider.hpp>

#include <iostream>
#include <cmath>

#define PI 3.1415926535897932384626

namespace vasteroids {

static bool Collide(const Asteroid& asteroid, const Point2D<float>& point);

bool Collide(const Asteroid& asteroid, const WorldPosition& point) {
  // perform a test to see if the point and the asteroid are in neighboring chunks
  // then extract point and use point rel
  Point2D<int> dist = point.chunk - asteroid.position.chunk;
  if (std::abs(dist.x) > 1 || std::abs(dist.y) > 1) {
    return false;
  }

  // position of point relative to its chunk
  Point2D<float> pointPos = point.position;
  // position of asteroid relative to point's chunk
  Point2D<float> asteroidPos = asteroid.position.position - Point2D<float>{ dist.x * chunk_size, dist.y * chunk_size };
  // position of point relative to asteroid
  Point2D<float> point_rel = (pointPos - asteroidPos);
  // transform point based on rotation
  // point_rel is relative to asteroid center, but not rotated to account for asteroid's rotation.
  float rot_cos = cos(-asteroid.rotation);
  float rot_sin = sin(-asteroid.rotation);
  point_rel = { (point_rel.x * rot_cos) + (point_rel.y * rot_sin),
                (point_rel.x * -rot_sin) + (point_rel.y * rot_cos) };
  return Collide(asteroid, point_rel);
}

static bool Collide(const Asteroid& asteroid, const Point2D<float>& pt) {
  float wind_distance = 0.0f;
  float theta_last, delta_theta;
  Point2D<float> delta = asteroid.geometry[asteroid.geometry.size() - 1] - pt;
  theta_last = atan2(delta.y, delta.x);
  for (size_t i = 0; i < asteroid.geometry.size(); i++) {
    delta = asteroid.geometry[i] - pt;
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

bool Collide(const Asteroid& asteroid, const WorldPosition& line_start, const WorldPosition& line_end, int steps) {
  Point2D<float> asteroidPos = asteroid.position.position;
  Point2D<float> lineStartPos = line_start.position;
  lineStartPos += Point2D<float>( chunk_size * (line_start.chunk.x - asteroid.position.chunk.x),
                                  chunk_size * (line_start.chunk.y - asteroid.position.chunk.y));
  Point2D<float> lineEndPos = line_end.position;
  lineEndPos   += Point2D<float>( chunk_size * (line_end.chunk.x   - asteroid.position.chunk.x),
                                  chunk_size * (line_end.chunk.y   - asteroid.position.chunk.y));

  float rot_sin = sin(-asteroid.rotation);
  float rot_cos = cos(-asteroid.rotation);

  lineStartPos = {
    (lineStartPos.x * rot_cos) + (lineStartPos.y * rot_sin),
    (lineStartPos.x * -rot_sin) + (lineStartPos.y * rot_cos)
  };

  lineEndPos = {
    (lineEndPos.x * rot_cos) + (lineEndPos.y * rot_sin),
    (lineEndPos.x * -rot_sin) + (lineEndPos.y * rot_cos)
  };

  Point2D<float> lineDelta = (lineEndPos - lineStartPos) * (1.0f / steps);
  for (int i = 0; i <= steps; i++) {
    if (Collide(asteroid, lineStartPos)) {
      return true;
    }

    lineStartPos += lineDelta;
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

  Asteroid a = Asteroid(asteroid);
  WorldPosition c = WorldPosition(point);
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