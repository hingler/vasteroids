#include <Projectile.hpp>
namespace vasteroids {
  Projectile::Projectile(Napi::Object obj) : Instance(obj) {
    Napi::Value create_time = obj.Get("creationTime");
    if (!create_time.IsNumber()) {
      TYPEERROR(obj.Env(), "'creationTime' field not present!");
    } 

    creation_time = create_time.As<Napi::Number>().FloatValue();

    Napi::Value id = obj.Get("clientID");
    if (!id.IsNumber()) {
      TYPEERROR(obj.Env(), "'id' field not present!");
    }

    client_ID = id.As<Napi::Number>().Uint32Value();
  }
}