#ifndef BIOME_H_
#define BIOME_H_

#include <napi.h>

namespace vasteroids {

enum class Biome {
  NORMAL = 1,
  BARREN = 2,
  ASTEROIDFIELD = 3,
  NEBULA = 4,
  BLACKHOLE = 5,
  INVALID = 6
};

const std::string& BiomeToString(const Biome& b);
Napi::String BiomeToString(const Biome& b, const Napi::Env& env);

}

#endif