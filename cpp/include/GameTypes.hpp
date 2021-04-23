#ifndef GAME_TYPES_H_
#define GAME_TYPES_H_

#include <napi.h>
#include <chrono>
#include <iostream>

#define TYPEERROR(env, x) Napi::TypeError::New(env, x).ThrowAsJavaScriptException()

namespace vasteroids {

  constexpr float chunk_size { 128.0f };

  enum class InstanceType {
    ASTEROID,
    SHIP,
    PROJECTILE,
    DELTA
  };

  /**
   *  Converts an InstanceType to a string, where it can be interpreted in TS.
   */ 
  std::string InstanceToString(const InstanceType& type);

  template <typename T = float>
  struct Point2D {
    T x;
    T y;

    Point2D() {}

    Point2D(Napi::Object obj) {
      Napi::Env env = obj.Env();
      if (!obj.Has("x") || !obj.Has("y")) {
        Napi::TypeError::New(env, "point does not contain correct fields").ThrowAsJavaScriptException();
      }

      x = static_cast<T>(obj.Get("x").As<Napi::Number>().DoubleValue());
      y = static_cast<T>(obj.Get("y").As<Napi::Number>().DoubleValue());
    }

    Point2D(T x, T y) {
      this->x = x;
      this->y = y;
    }

    Napi::Object ToNodeObject(Napi::Env env) const {
      Napi::Object obj = Napi::Object::New(env);
      obj.Set("x", x);
      obj.Set("y", y);
      return obj;
    }

    Point2D& operator=(const Point2D<T>& rhs) {
      this->x = rhs.x;
      this->y = rhs.y;
      return *this;
    }

    Point2D(const Point2D<T>& rhs) {
      this->x = rhs.x;
      this->y = rhs.y;
    }

    Point2D& operator+=(const Point2D<T>& rhs) {
      this->x += rhs.x;
      this->y += rhs.y;
      return *this;
    }

    template<typename U>
    Point2D& operator*=(U mult) {
      this->x *= mult;
      this->y *= mult;
      return *this;
    }
  };

  template<typename T>
  bool operator==(const Point2D<T>& lhs, const Point2D<T>& rhs) {
    return (lhs.x == rhs.x && lhs.y == rhs.y);
  }

  template<typename T>
  Point2D<T> operator+(const Point2D<T>& lhs, const Point2D<T>& rhs) {
    return { lhs.x + rhs.x, lhs.y + rhs.y };
  }

  template<typename T>
  Point2D<T> operator-(const Point2D<T>& lhs, const Point2D<T>& rhs) {
    return { lhs.x - rhs.x, lhs.y - rhs.y };
  }

  template<typename T, typename U>
  Point2D<T> operator*(const Point2D<T>& lhs, U mult) {
    return { lhs.x * mult, lhs.y * mult };
  }

  struct WorldPosition {
    Point2D<int> chunk;
    Point2D<float> position;

    WorldPosition() {
      chunk.x = 0;
      chunk.y = 0;
      position.x = 0.0f;
      position.y = 0.0f;
    }
    
    WorldPosition(Napi::Object obj);

    /**
     *  Returns this worldposition as a Node object.
     */ 
    Napi::Object ToNodeObject(Napi::Env env) const;
  };

  struct Instance {
    WorldPosition position;
    Point2D<> velocity;
    float rotation;
    float rotation_velocity;

    // unique identifier assigned by WorldSim.
    uint64_t id;

    // tracks number of updates to instance.
    uint32_t ver;

    // time of last update Wrt server start
    double last_update;

    // def ctor, no init
    Instance() {}
    Instance(Napi::Object obj);

    virtual Napi::Object ToNodeObject(Napi::Env env) const;
  };

} // namespace vasteroids

namespace std {

template<>
struct hash<vasteroids::Point2D<int>> {
  std::size_t operator()(vasteroids::Point2D<int> const& p) const noexcept {
    std::size_t base = static_cast<size_t>(p.x) << 32;
    base |= static_cast<size_t>(p.y);
    return base;
  }
};

} // namespace std

#endif  // GAME_TYPES_H_