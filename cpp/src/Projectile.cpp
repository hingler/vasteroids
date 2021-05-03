#include <Projectile.hpp>
namespace vasteroids {
  Projectile::Projectile(Napi::Object obj) : Instance(obj) {
    Napi::Value id = obj.Get("clientID");
    if (!id.IsNumber()) {
      TYPEERROR(obj.Env(), "'id' field not present!");
    }

    client_ID = id.As<Napi::Number>().Uint32Value();

    Napi::Value creation = obj.Get("creationTime");
    if (!creation.IsNumber()) {
      TYPEERROR(obj.Env(), "'creationTime' field not present!");
    }

    creation_time = creation.As<Napi::Number>().Uint32Value();

    Napi::Value org = obj.Get("origin");
    if (!org.IsObject()) {
      TYPEERROR(obj.Env(), "'origin' field not correct");
    }

    origin = WorldPosition(org.As<Napi::Object>());
  }

  Napi::Object Projectile::ToNodeObject(Napi::Env env) const {
    Napi::Object res = Instance::ToNodeObject(env);
    res.Set("clientID", Napi::Number::New(env, client_ID));
    res.Set("creationTime", Napi::Number::New(env, creation_time));
    res.Set("origin", origin.ToNodeObject(env));
    return res;
  }
}