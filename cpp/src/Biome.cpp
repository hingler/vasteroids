#include <Biome.hpp>

namespace vasteroids {

static std::string strings[6] = {
  "normal",
  "barren",
  "asteroidfield",
  "nebula",
  "blackhole",
  "invalid"
};

Napi::String BiomeToString(const Biome& b, const Napi::Env& env) {
  return Napi::String::New(env, strings[static_cast<int>(b)]);
}

}