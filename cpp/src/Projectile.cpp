#include <Projectile.hpp>
namespace vasteroids {
  Projectile::Projectile(Napi::Object obj) : Instance(obj) {
    Napi::Value id = obj.Get("clientID");
    if (!id.IsNumber()) {
      TYPEERROR(obj.Env(), "'id' field not present!");
    }

    client_ID = id.As<Napi::Number>().Uint32Value();
  }

  Napi::Object Projectile::ToNodeObject(Napi::Env env) const {
    Napi::Object res = Instance::ToNodeObject(env);
    res.Set("clientID", Napi::Number::New(env, client_ID));
    return res;
  }
}