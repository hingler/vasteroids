#ifndef BIOME_H_
#define BIOME_H_

#include <napi.h>

namespace vasteroids {

enum class Biome {
  NORMAL = 0,
  BARREN = 1,
  ASTEROIDFIELD = 2,
  NEBULA = 3,
  BLACKHOLE = 4,
  INVALID = 5
};

const std::string& BiomeToString(const Biome& b);
Napi::String BiomeToString(const Biome& b, const Napi::Env& env);

}

#endif