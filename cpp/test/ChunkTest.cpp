#include <server/Chunk.hpp>
#include <AsteroidGenerator.hpp>

#include <iostream>

#define ERROR(env, msg) Napi::Error::New(env, msg).ThrowAsJavaScriptException()
#define TESTIT(cond, msg) if (!(cond)) ERROR(env, msg)

using namespace vasteroids;
using server::Chunk;

void RunTest(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Chunk c;

  // simple insert test
  Ship s;
  s.id = 1;
  s.position.chunk = {1, 1};
  s.position.position = { 16.0f, 16.0f };
  s.name = "hello!";
  s.rotation = 0.0f;
  s.rotation_velocity = 0.0f;
  s.velocity = { 0.0f, 0.0f };
  s.ver = 1;

  c.InsertShip(s);
  
  server::ServerPacket sr;
  c.GetContents(sr);
  
  TESTIT(sr.asteroids.size() == 0, "Asteroids size should be 0!");
  TESTIT(sr.deltas.size() == 0, "Deltas size should be 0!");
  TESTIT(sr.ships.size() == 1, "Ship size should be 1!");

  Ship s_copy = sr.ships[0];
  TESTIT(s_copy.id == 1, "Invalid ID on returned ship");
  TESTIT((s_copy.name == s.name), "Name does not match!");
  TESTIT(std::abs(s.rotation) < 0.00001f, "Rotation of ship is non-zero!");
  TESTIT(s_copy.ver == 1, "Ship records a modification!");
  
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("RUNCHUNKTEST", Napi::Function::New(env, RunTest));
  return exports;
}

NODE_API_MODULE(chunktest, Init);