#ifndef POINT2D_H_
#define POINT2D_H_

#include <napi.h>

namespace vasteroids {

// simple point class
struct Point2D {
  double x;
  double y;

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

  Napi::Object NodeObjectFromPoint(Napi::Env env) const {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("x", x);
    obj.Set("y", y);
    return obj;
  }
};

Point2D operator+(const Point2D& lhs, const Point2D& rhs);

Point2D operator-(const Point2D& lhs, const Point2D& rhs);

}

#endif