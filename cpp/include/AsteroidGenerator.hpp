#ifndef ASTEROID_GENERATOR_H_
#define ASTEROID_GENERATOR_H_

#include <napi.h>
#include <Asteroid.hpp>

namespace vasteroids {

/**
 *  Generates a new asteroid with a provided number of points.
 *  @param radius - the maximum radius of our asteroid.
 *  @param points - the number of points used to represent our asteroid.
 */
Asteroid GenerateAsteroid(float radius, int32_t points);

}

#endif