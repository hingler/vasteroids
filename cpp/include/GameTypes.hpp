#ifndef GAME_TYPES_H_
#define GAME_TYPES_H_

#include <napi.h>

#define TYPEERROR(env, x) Napi::TypeError::New(env, x).ThrowAsJavaScriptException()

namespace vasteroids {

  constexpr float chunk_size { 128.0f };

  enum class InstanceType {
    ASTEROID,
    SHIP,
    PROJECTILE
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
  };

  template<typename T>
  Point2D<T> operator+(const Point2D<T>& lhs, const Point2D<T>& rhs) {
    return { lhs.x + rhs.x, lhs.y + rhs.y };
  }

  template<typename T>
  Point2D<T> operator-(const Point2D<T>& lhs, const Point2D<T>& rhs) {
    return { lhs.x - rhs.x, lhs.y - rhs.y };
  }

  struct WorldPosition {
    Point2D<int> chunk;
    Point2D<float> position;

    WorldPosition() {}
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

    // def ctor, no init
    Instance() {}
    Instance(Napi::Object obj);

    virtual Napi::Object ToNodeObject(Napi::Env env) const;
  };

} // namespace vasteroids

#endif  // GAME_TYPES_H_