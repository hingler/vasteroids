#ifndef GAME_TYPES_H_
#define GAME_TYPES_H_

#include <napi.h>

// TODO: remove this later :)
#define CHUNK_SIZE 128.0f

namespace vasteroids {
  template <typename T = float>
  struct Point2D {
    T x;
    T y;

    Napi::Object ToNodeObject(Napi::Env env) const {
      Napi::Object obj = Napi::Object::New(env);
      obj.Set("x", x);
      obj.Set("y", y);
      return obj;
    }

    static Point2D FromNodeObject(Napi::Object obj) {
      Point2D res;

      Napi::Env env = obj.Env();
      if (!obj.Has("x") || !obj.Has("y")) {
        Napi::TypeError::New(env, "point does not contain correct fields").ThrowAsJavaScriptException();
      }

      res.x = obj.Get("x").As<Napi::Number>().DoubleValue();
      res.y = obj.Get("y").As<Napi::Number>().DoubleValue();
      return res;
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

    /**
     *  Returns this worldposition as a Node object.
     */ 
    Napi::Object ToNodeObject(Napi::Env env) const;

    /**
     *  Creates a new WorldPosition from its respective node object.
     */ 
    static WorldPosition FromNodeObject(Napi::Object obj);
  };

  struct Instance {
    WorldPosition position;
    Point2D<> velocity;
    float rotation;
    float rotation_velocity;

    Napi::Object ToNodeObject(Napi::Env env) const;

    static Instance FromNodeObject(Napi::Object obj);
  };

} // namespace vasteroids

#endif  // GAME_TYPES_H_