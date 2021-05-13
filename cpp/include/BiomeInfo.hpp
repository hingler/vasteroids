#ifndef BIOME_INFO_H_
#define BIOME_INFO_H_

#include <Biome.hpp>
#include <GameTypes.hpp>

#include <napi.h>

namespace vasteroids {

struct BiomeInfo {
  BiomeInfo() {}
  Napi::Object ToNodeObject(Napi::Env env) const {
    Napi::Object res = Napi::Object::New(env);
    res.Set("chunk", chunk.ToNodeObject(env));
    res.Set("biome", Napi::Number::New(env, static_cast<int>(biome)));
    return res;
  }

  Point2D<int> chunk;
  Biome biome;
  
};
}

#endif