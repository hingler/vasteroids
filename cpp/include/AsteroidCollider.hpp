#ifndef ASTEROID_COLLIDER_H_
#define ASTEROID_COLLIDER_H_

#include <Point2D.hpp>
#include <Asteroid.hpp>


namespace vasteroids {

/**
 *  Determines whether a point particle collides with an asteroid.
 *  @param asteroid - the asteroid we're checking for collisions.
 *  @param point - the point particle itself.
 */
bool Collide(const Asteroid& asteroid, const Point2D& point);

}

#endif