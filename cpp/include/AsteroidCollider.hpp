#ifndef ASTEROID_COLLIDER_H_
#define ASTEROID_COLLIDER_H_

#include <GameTypes.hpp>
#include <Asteroid.hpp>


namespace vasteroids {

/**
 *  Determines whether a point particle collides with an asteroid.
 *  @param asteroid - the asteroid we're checking for collisions.
 *  @param point - the point particle itself.
 *  @returns true if a collision occurs -- false otherwise.
 */
bool Collide(const Asteroid& asteroid, const WorldPosition& point);

/**
 *  Determines whether a line which some point particle passes through intersects an asteroid.
 *  @param asteroid - the asteroid we're checking for collisions.
 *  @param line_start - the start of the line.
 *  @param line_end - the end of the line.
 *  @returns true if a collision occurs -- false otherwise.
 */ 
bool Collide(const Asteroid& asteroid, const WorldPosition& line_start, const WorldPosition& line_end);

// for much later: write in asteroid/asteroid collisions?

}

#endif