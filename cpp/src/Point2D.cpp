#include <Point2D.hpp>

namespace vasteroids {

Point2D operator+(const Point2D& lhs, const Point2D& rhs) {
  return { lhs.x + rhs.x, lhs.y + rhs.y };
}

Point2D operator-(const Point2D& lhs, const Point2D& rhs) {
  return { lhs.x - rhs.x, lhs.y - rhs.y };
}

}