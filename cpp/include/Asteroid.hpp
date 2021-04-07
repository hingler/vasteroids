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

  /**
   *  Creates a new Asteroid from a Node object.
   *  @param obj - the node object being passed in.
   */ 
  static Asteroid FromNodeObject(Napi::Object obj);

  /**
   *  Returns this Asteroid as a node object.
   *  @param env - the environment this node object is being constructed in.
   */
  Napi::Object ToNodeObject(Napi::Env env);
};

}

#endif