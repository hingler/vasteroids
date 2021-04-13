#include <server/Chunk.hpp>
#include <AsteroidGenerator.hpp>

#include <chrono>
#include <iostream>

#include <napitest.hpp>

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
  s.velocity = { 1.0f, 0.0f };
  s.ver = 1;

  c.InsertShip(s);
  
  server::ServerPacket sr;
  c.GetContents(sr);
  
  ASSERT_E(0, sr.asteroids.size(), env, "Asteroids size should be 0!");
  ASSERT_E(0, sr.deltas.size(), env, "Deltas size should be 0!");
  ASSERT_E(1, sr.ships.size(), env, "Ship size should be 1!");

  Ship s_copy = sr.ships[0];
  ASSERT_E(s_copy.id, 1, env, "Invalid ID on returned ship");
  ASSERT_E(s.name, s_copy.name, env, "Name does not match!");
  ASSERT_N(0.0f, s.rotation, 0.000001f, env, "Rotation of ship is non-zero!");
  ASSERT_E(1, s_copy.ver, env, "Ship records a modification!");

  std::this_thread::sleep_for(std::chrono::milliseconds(1000));
  sr = server::ServerPacket();
  ASSERT_E(0, sr.ships.size(), env, "Ship size should be 0!");
  c.UpdateChunk(sr);
  if (sr.ships.size() > 0) {
    std::cout << sr.ships[0].position.position.x << ", " << sr.ships[0].position.position.y << std::endl;
  }

  ASSERT_E(0, sr.ships.size(), env, "Ship size should be 0!");
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("RUNCHUNKTEST", Napi::Function::New(env, RunTest));
  return exports;
}

NODE_API_MODULE(chunktest, Init);