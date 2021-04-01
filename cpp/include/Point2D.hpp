#ifndef POINT2D_H_
#define POINT2D_H_

#include <napi.h>

namespace vasteroids {

// simple point class
struct Point2D {
  double x;
  double y;

  Napi::Object NodeObjectFromPoint(Napi::Env env) const {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("x", x);
    obj.Set("y", y);
    return obj;
  }
};

}

#endif