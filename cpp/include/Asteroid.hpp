#ifndef ASTEROID_H_
#define ASTEROID_H_

#include <napi.h>

#include <GameTypes.hpp>

#include <vector>

namespace vasteroids {

/**
 *  Represents a single asteroid.
 */
struct Asteroid : public Instance {
  // points describing the asteroid, relative to its center. defined in CCW order relative to +X axis.
  std::vector<Point2D<float>> geometry;
  
  Asteroid();
  Asteroid(Napi::Object obj);

  /**
   *  Returns this Asteroid as a node object.
   *  @param env - the environment this node object is being constructed in.
   */
  Napi::Object ToNodeObject(Napi::Env env);
};

}

#endif