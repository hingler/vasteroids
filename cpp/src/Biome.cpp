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


const std::string& BiomeToString(const Biome& b) {
  return strings[static_cast<int>(b) - 1];
}
Napi::String BiomeToString(const Biome& b, const Napi::Env& env) {
  return Napi::String::New(env, BiomeToString(b));
}

}