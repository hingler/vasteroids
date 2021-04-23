#include <server/Chunk.hpp>
#include <AsteroidGenerator.hpp>

#include <chrono>
#include <iostream>
#include <thread>

#include <napitest.hpp>

using namespace vasteroids;
using server::Chunk;

void RunTest(const Napi::CallbackInfo& info) {
  auto origin = std::chrono::high_resolution_clock::now();
  Napi::Env env = info.Env();
  Chunk c(0.0);

  // simple insert test
  Ship s;
  s.id = 1;
  s.position.chunk = {1, 1};
  s.position.position = { 16.0f, 16.0f };
  s.name = "hello!";
  s.rotation = 0.0f;
  s.rotation_velocity = 0.0f;
  s.velocity = { 2.0f, 0.0f };
  s.last_update = 0.0;
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

  sr = server::ServerPacket();
  ASSERT_E(0, sr.ships.size(), env, "Ship size should be 0!");
  c.UpdateChunk(sr, 0.5);
  if (sr.ships.size() > 0) {
    std::cout << sr.ships[0].position.position.x << ", " << sr.ships[0].position.position.y << std::endl;
  }

  ASSERT_E(0, sr.ships.size(), env, "Ship size should be 0!");
  
  c.GetContents(sr);
  ASSERT_E(1, sr.ships.size(), env, "Ship disappeared?");
  
  s_copy = sr.ships[0];
  ASSERT_N(17.0f, s_copy.position.position.x, 0.01f, env, "Position is not what we would expect");
  ASSERT_N(16.0f, s_copy.position.position.y, 0.01f, env, "Position is not what we would expect");
  ASSERT_E(1, s_copy.position.chunk.x, env, "Chunk swapped on us!");
  ASSERT_E(1, s_copy.position.chunk.y, env, "Chunk swapped on us!");


  ASSERT_E(1, s_copy.ver, env, "version number updated when it should not.");

  Asteroid a = GenerateAsteroid(1.5, 12);
  a.id = 2;
  a.position.chunk = {0, 0};
  a.position.position = {0.5f, 0.5f};
  a.velocity = { -5.0f, -5.0f };
  a.last_update = 0.5;
  c.InsertAsteroid(a);

  sr = server::ServerPacket();
  c.UpdateChunk(sr, 1.0);

  ASSERT_E(0, sr.ships.size(), env, "Ship size is non zero :(");
  ASSERT_E(1, sr.asteroids.size(), env, "Expected asteroid to be omitted from chunk!");
  a = sr.asteroids[0];
  ASSERT_E(-1, a.position.chunk.x, env, "chunk is not right :(");
  ASSERT_E(-1, a.position.chunk.y, env, "chunk is not right :(");
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("RUNCHUNKTEST", Napi::Function::New(env, RunTest));
  return exports;
}

NODE_API_MODULE(chunktest, Init);