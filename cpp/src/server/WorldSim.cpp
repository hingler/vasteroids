#include <server/WorldSim.hpp>
#include <client/ClientPacket.hpp>

#include <AsteroidGenerator.hpp>

#include <cmath>
#include <iostream>

namespace vasteroids {
namespace server {

using client::ClientPacket;

Napi::Function WorldSim::GetClassInstance(Napi::Env env) {
  return DefineClass(env, "WorldSim", {
    InstanceMethod("GetChunkDims", &WorldSim::GetChunkDims),
    InstanceMethod("HandleClientPacket", &WorldSim::HandleClientPacket),
    InstanceMethod("UpdateSim", &WorldSim::UpdateSim),
    InstanceMethod("AddShip", &WorldSim::AddShip),
    InstanceMethod("DeleteShip", &WorldSim::DeleteShip),
    InstanceMethod("GetServerTime", &WorldSim::GetServerTime)
  });
}

WorldSim::WorldSim(const Napi::CallbackInfo& info) : ObjectWrap(info) {
  origin_time_ = std::chrono::high_resolution_clock::now();
  id_max_ = 1;
  Napi::Env env = info.Env();
  Napi::Value chunks = info[0];
  if (!chunks.IsNumber()) {
    TYPEERROR(env, "Param used to construct worldsim is not a number!");
  }

  chunk_dims_ = chunks.As<Napi::Number>().Int32Value();

  cw_ = std::make_shared<CollisionWorld>(chunk_dims_);

  Napi::Value asteroidsObj = info[1];
  if (!asteroidsObj.IsNumber()) {
    TYPEERROR(env, "Number of asteroids initially spawned not specified.");   
  }

  int asteroids = asteroidsObj.As<Napi::Number>().Int32Value();
  
  // generating asteroids initially?
  // use a gaussian distribution to place our asteroids in the world
  // use GenerateNewAsteroid to place them
  // gaussian a chunk, choose a random point inside that chunk.
  std::random_device dev;
  gen = std::mt19937(dev());
  chunk_gen = std::normal_distribution<>(chunk_dims_ / 2.0, chunk_dims_ / 4.0);
  coord_gen = std::uniform_real_distribution<float>(0.0f, chunk_size);
  velo_gen = std::uniform_real_distribution<float>(-3.0, 3.0);

  WorldPosition temp;
  for (int i = 0; i < asteroids; i++) {
    while (temp.chunk.x < 0 || temp.chunk.x >= chunk_dims_
        || temp.chunk.y < 0 || temp.chunk.y >= chunk_dims_) {
      temp.chunk.x = static_cast<int>(chunk_gen(gen));
      temp.chunk.y = static_cast<int>(chunk_gen(gen));
    }

    temp.position.x = coord_gen(gen);
    temp.position.y = coord_gen(gen);

    SpawnNewAsteroid(temp);
  }
}

Napi::Value WorldSim::GetChunkDims(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), chunk_dims_);
}

Napi::Value WorldSim::HandleClientPacket(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Value packetObj = info[0];
  if (!packetObj.IsObject()) {
    TYPEERROR(env, "argument to `HandleClientPacket` is not a ClientPacket!");
  }

  ClientPacket packet(packetObj.As<Napi::Object>());

  // find old ship record
  auto ship_old = ships_.find(packet.client_ship.id);
  if (ship_old == ships_.end()) {
    Napi::Error::New(env, "Updated ship does not exist!").ThrowAsJavaScriptException();
  }

  Point2D<int> chunk = ship_old->second;

  // ships might enter chunks which have yet to be occupied
  auto c = chunks_.find(chunk);
  if (c == chunks_.end()) {
    Napi::Error::New(env, "Invariant not maintained -- ship does not exist in chunk!").ThrowAsJavaScriptException();
  }

  auto& ship_new = packet.client_ship;

  {
    // update ver number
    // we're grabbing this ship from the chunk we *think* has it
    // but that chunk has since moved
    Ship* ship_last = c->second.GetShip(packet.client_ship.id);
    ship_new.ver = ship_last->ver + 1;
  }
  
  // remove old ship from old chunk
  // differentiate from deletion :(
  c->second.MoveShip(packet.client_ship.id);

  CorrectChunk(ship_new);
  Point2D<int> new_chunk = ship_new.position.chunk;

  if (chunks_.find(new_chunk) == chunks_.end()) {
    CreateChunk(new_chunk);
  }

  ship_new.last_update = GetServerTime_();
  chunks_.at(new_chunk).InsertShip(ship_new);

  // update ships list to match new chunk
  ships_.erase(ship_new.id);
  ships_.insert(std::make_pair(ship_new.id, new_chunk));

  for (auto& proj : packet.projectiles) {
    HandleNewProjectile(packet.client_ship.id, proj);
  }

  // handle projectiles!
  return env.Undefined();
}

void WorldSim::CorrectChunk(Instance& inst) {
  Point2D<int> new_chunk = inst.position.chunk;
  if (new_chunk.x < 0 || new_chunk.x >= chunk_dims_
  ||  new_chunk.y < 0 || new_chunk.y >= chunk_dims_) {
    // scoop it back around back in bounds
    new_chunk.x -= (chunk_dims_ * static_cast<int>(std::floor(new_chunk.x / static_cast<double>(chunk_dims_))));
    new_chunk.y -= (chunk_dims_ * static_cast<int>(std::floor(new_chunk.y / static_cast<double>(chunk_dims_))));
  }

  inst.position.chunk = new_chunk;
}



void WorldSim::HandleNewProjectile(uint64_t ship_id, Projectile& proj) {
  // for each projectile
  // store it in its respective chunk
  // store a reference to its id in a temporary map
  // when updating the sim:
  //  - read from that map
  //  - for a given ship, if a projectile's ID is in that map:
  //  - place it in a special "registeredProjectiles" field
  //  - this field will indicate to the client which of its generated projectiles
  //    are where according to the server
  //    and from there our client can let the server take over :)
  CorrectChunk(proj);
  // generate a new ID for this projectile
  proj.id = id_max_++;
  proj.ship_ID = ship_id;
  proj.creation_time = GetServerTime_();
  // fudge a bit to ensure we don't send too much at once
  proj.origin_time = GetServerTime_() - coord_gen(gen) / 8.0f;
  
  // inserted when the ship is added
  // we should have already guaranteed that the ship id is valid :)
  new_projectiles_.at(ship_id).insert(proj.client_ID);
  // assumption: it should be impossible for a ship to generate a projectile,
  // and abandon it in the next update

  // but we can account for this:)
  Point2D<int> new_chunk = proj.position.chunk;
  if (chunks_.find(new_chunk) == chunks_.end()) {
    CreateChunk(new_chunk);
  }

  chunks_.at(new_chunk).InsertProjectile(proj);
}

Napi::Value WorldSim::UpdateSim(const Napi::CallbackInfo& info) {
  // update all components
  // figure out which chunks we need to update
  double server_time = GetServerTime_();
  Napi::Env env = info.Env();
  Napi::Object obj_ret = Napi::Object::New(env);
  std::unordered_set<Point2D<int>> update_chunks;
  for (auto ship : ships_) {
    for (int x = ship.second.x - 1; x <= ship.second.x + 1; x++) {
      for (int y = ship.second.y - 1; y <= ship.second.y + 1; y++) {
        Point2D<int> chunk(x, y);
        FixChunkBoundaries(chunk);

        update_chunks.insert(chunk);
      }
    }
  }

  // update the chunks we have to update
  ServerPacket collate;
  for (auto point : update_chunks) {
    if (!chunks_.count(point)) {
      continue;
    }

    chunks_.at(point).UpdateChunk(collate, server_time);
  }

  // collate now contains all of the elements which have been displaced, properly simulated.
  // chunks may overflow -- handle here!
  for (auto a : collate.asteroids) {
    FixChunkBoundaries(a.position.chunk);
    Point2D<int> chunk_coord = a.position.chunk;
    // we need to fix the chunk
    if (!chunks_.count(chunk_coord)) {
      CreateChunk(chunk_coord);
    }

    a.last_update = server_time;
    chunks_.at(chunk_coord).InsertAsteroid(a);
  }

  for (auto s : collate.ships) {
    FixChunkBoundaries(s.position.chunk);
    Point2D<int> chunk_coord = s.position.chunk;
    if (!chunks_.count(chunk_coord)) {
      CreateChunk(chunk_coord);
    }

    s.last_update = server_time;
    chunks_.at(chunk_coord).InsertShip(s);
    // handle ships which have been moved!
    // does not quantify an update yet, so do not adjust ver number
    ships_.erase(s.id);
    ships_.insert(std::make_pair(s.id, chunk_coord));
  }

  for (auto p : collate.projectiles) {
    FixChunkBoundaries(p.position.chunk);
    Point2D<int> chunk_coord = p.position.chunk;

    if (!chunks_.count(chunk_coord)) {
      CreateChunk(chunk_coord);
    }

    p.last_update = server_time;
    chunks_.at(chunk_coord).InsertProjectile(p);
  }

  // now, we would check relevant chunks for collisions
  // poll our chunks again with a server packet
  ServerPacket simmed;
  for (auto point : update_chunks) {
    if (!chunks_.count(point)) {
      continue;
    }

    // we need these deleted instances below!
    chunks_.at(point).GetContents(simmed);
  }

  cw_->clear();

  for (auto a : simmed.asteroids) {
    cw_->AddAsteroid(a);
  }

  for (auto p : simmed.projectiles) {
    cw_->AddProjectile(p);
  }

  std::unordered_map<uint64_t, Point2D<int>> deleted;
  std::vector<std::pair<WorldPosition, float>> collide_pos;

  auto client_map = cw_->ComputeCollisions(deleted, collide_pos);
  // delete instances from relevant chunks
  // add asteroids to relevant chunks
  for (auto& del : deleted) {
    // should be valid -- if inst moved to new chunk, we would have created it in prev step
    // projectiles are deleted by the time they get here
    chunks_.at(del.second).RemoveInstance(del.first);
  }

  for (auto& pos : collide_pos) {
    SpawnNewAsteroid(pos.first, pos.second, 12);
    SpawnNewAsteroid(pos.first, pos.second, 12);
  }

  // lastly, we need to figure out which entities to expose to which instances
  
  // for each chunk nearby:
  // create a map to contain new knowns
  // if known and old version: delta only
  // if known and new version: send nothing
  // if unknown: send full

  // note: we can really easily multithread this  
  for (auto& ship : ships_) {
    uint64_t id = ship.first;
    std::unordered_map<uint64_t, uint32_t>& knowns = known_ids_.at(id);

    std::unordered_map<uint64_t, uint32_t> knowns_new;
    
    ServerPacket res;
    std::unordered_set<Point2D<int>> chunks_read;
    for (int x = ship.second.x - 1; x <= ship.second.x + 1; x++) {
      for (int y = ship.second.y - 1; y <= ship.second.y + 1; y++) {
        Point2D<int> chunk(x, y);
        FixChunkBoundaries(chunk);
        // what do we do if world is smaller than 3x3?
        // chunks will be re-counted.

        // if the chunk has been handled, it will be in here.
        if (chunks_read.count(chunk)) {
          continue;
        }

        chunks_read.insert(chunk);

        // chunk does not contain anything
        if (!chunks_.count(chunk)) {
          continue;
        }

        chunks_.at(chunk).GetContents(res);
      }
    }

    Instance delta_pkt;
    // res now contains all nearby objects -- trim it down based on `knowns`
    auto itr_a = res.asteroids.begin();
    while (itr_a != res.asteroids.end()) {
      if (deleted.count(itr_a->id)) {
        // delete immediately!
        res.deleted.insert(itr_a->id);
        itr_a = res.asteroids.erase(itr_a);
        continue;
      }

      knowns_new.insert(std::make_pair(itr_a->id, itr_a->ver));
      if (knowns.count(itr_a->id)) {
        // known
        if (knowns.at(itr_a->id) != itr_a->ver) {
          // known, but out of date
          // remove from itr, add to delta
          delta_pkt.id = itr_a->id;
          delta_pkt.position = itr_a->position;
          delta_pkt.velocity = itr_a->velocity;
          delta_pkt.rotation = itr_a->rotation;
          delta_pkt.rotation_velocity = itr_a->rotation_velocity;
          delta_pkt.last_update = itr_a->last_update;
          res.deltas.push_back(std::move(delta_pkt));
        }

        itr_a = res.asteroids.erase(itr_a);
      } else {
        itr_a++;
        // unknown -- send the whole packet! 
      }
    }

    auto itr_s = res.ships.begin();
    while (itr_s != res.ships.end()) {
      if (itr_s->id == id) {
        itr_s = res.ships.erase(itr_s);
        continue;
      }
      knowns_new.insert(std::make_pair(itr_s->id, itr_s->ver));
      if (knowns.count(itr_s->id)) {
        if (knowns.at(itr_s->id) != itr_s->ver) {
          delta_pkt.id = itr_s->id;
          delta_pkt.position = itr_s->position;
          delta_pkt.velocity = itr_s->velocity;
          delta_pkt.rotation = itr_s->rotation;
          delta_pkt.rotation_velocity = itr_s->rotation_velocity;
          delta_pkt.last_update = itr_s->last_update;
          res.deltas.push_back(std::move(delta_pkt));
        }

        itr_s = res.ships.erase(itr_s);
      } else {
        itr_s++;
      }
    }

    // start by grabbing a reference to our thing
    // for each projectile in the packet:
    //  - if the projectile is in our set, move it to projectile local and remove it from the set
    //  - otherwise, leave it in projectiles
    auto* proj_new = &new_projectiles_.at(id);
    auto itr_p = res.projectiles.begin();
    while (itr_p != res.projectiles.end()) {
      if (deleted.count(itr_p->id)) {
        // odd workaround
        // if a projectile collides on first tick, it is erased and the client doesn't notice
        // we do this deleted check since our server sometimes can't keep up
        // but if we skip it on the first tick, the projectile will exist for one additional tick
        // and then be deleted -- this will give the client enough time to confirm its deletion
        res.deleted.insert(itr_p->id);
        if (proj_new->count(itr_p->client_ID) && itr_p->ship_ID == id) {
          res.deleted_local.insert(itr_p->client_ID);
        }
        itr_p = res.projectiles.erase(itr_p);
        continue;
      }
      if (proj_new->count(itr_p->client_ID) && itr_p->ship_ID == id) {
        // does not handle clashing proj ids
        // we just hit a projectile which is associated with this ship!
        // handle it, then drop it.
        res.projectiles_local.push_back(*itr_p);
        proj_new->erase(itr_p->client_ID);
        itr_p = res.projectiles.erase(itr_p);
        continue;
      }
      // we have sent this projectile before
      if (knowns.count(itr_p->id)) {
        if (knowns.at(itr_p->id) != itr_p->ver) {
          delta_pkt.id = itr_p->id;
          delta_pkt.position = itr_p->position;
          delta_pkt.velocity = itr_p->velocity;
          delta_pkt.rotation = itr_p->rotation;
          delta_pkt.rotation_velocity = itr_p->rotation_velocity;
          delta_pkt.last_update = itr_p->last_update;
          res.deltas.push_back(std::move(delta_pkt));
        }

        itr_p = res.projectiles.erase(itr_p);
      } else {
        itr_p++;
      }
    }

    res.server_time = server_time;
    if (client_map.count(id)) {
      for (auto& pr : client_map.at(id)) {
        res.deleted_local.insert(pr);
      }
    }

    known_ids_.erase(id);
    known_ids_.insert(std::make_pair(id, std::move(knowns_new)));
    // res still contains our server packet for this ship
    // map from ID to that packet!
    // key: id -- value: server packet
    std::string id_str = std::to_string(id);
    obj_ret.Set(std::move(id_str), res.ToNodeObject(env));
  }

  // obj_ret returns
  // keys: IDs as strings -- values: serverpackets
  return obj_ret;
}

Napi::Value WorldSim::AddShip(const Napi::CallbackInfo& info) {
  Napi::Env env =  info.Env();
  Napi::Value val = info[0];
  if (!val.IsString()) {
    TYPEERROR(env, "`name` is not a string!");
  }

  Ship s;
  // get name for this ship
  s.name = val.As<Napi::String>().Utf8Value();
  // add entries for our new ship
  while (s.position.chunk.x < 0 || s.position.chunk.x >= chunk_dims_
      || s.position.chunk.y < 0 || s.position.chunk.y >= chunk_dims_) {
    s.position.chunk.x = static_cast<int>(chunk_gen(gen));
    s.position.chunk.y = static_cast<int>(chunk_gen(gen));
  }

  if (!chunks_.count(s.position.chunk)) {
    CreateChunk(s.position.chunk);
  }

  s.position.position.x = coord_gen(gen);
  s.position.position.y = coord_gen(gen);
  s.id = id_max_++;
  s.velocity = {0.0f, 0.0f};
  s.rotation = 0.0f;
  s.rotation_velocity = 0.0f;
  s.ver = 0;
  s.last_update = GetServerTime_();
  s.origin_time = GetServerTime_() - coord_gen(gen) / 8.0f;
  // create the new ship and give it an id
  // find a random position for it to roam
  // return the new position of this ship

  new_projectiles_.insert(std::make_pair(s.id, std::unordered_set<uint64_t>()));
  ships_.insert(std::make_pair(s.id, s.position.chunk));
  known_ids_.insert(std::make_pair(s.id, std::unordered_map<uint64_t, uint32_t>()));
  chunks_.at(s.position.chunk).InsertShip(s);
  return s.ToNodeObject(env);
}

Napi::Value WorldSim::DeleteShip(const Napi::CallbackInfo& info) {
  // find the ship in our map and remove it
  // remove all entries associated with it
  // move on :)
  Napi::Env env = info.Env();
  Napi::Value val = info[0];
  if (!val.IsNumber()) {
    TYPEERROR(env, "param is not a number!");
  }

  uint64_t id = static_cast<uint64_t>(val.As<Napi::Number>().Int64Value());
  // remove from chunk
  if (!ships_.count(id)) {
    return Napi::Boolean::New(env, false);
  }

  if (!chunks_.at(ships_.at(id)).RemoveInstance(id)) {
    Napi::Error::New(env, "invariant broken: ship not present in chunk!").ThrowAsJavaScriptException();
  }

  // remove from class
  ships_.erase(id);
  known_ids_.erase(id);
  return Napi::Boolean::New(env, true);
}

// private funcs
void WorldSim::CreateChunk(Point2D<int> chunk_coord) {
  chunks_.insert(std::make_pair(chunk_coord, Chunk(GetServerTime_())));
}

void WorldSim::SpawnNewAsteroid(WorldPosition coord) {
  SpawnNewAsteroid(coord, 1.5f, 12);
}

void WorldSim::SpawnNewAsteroid(WorldPosition coord, float radius, int points) {
  if (!chunks_.count(coord.chunk)) {
    CreateChunk(coord.chunk);
  }

  auto& chunk = chunks_.at(coord.chunk);
  auto ast = GenerateAsteroid(radius, points);
  // random velocity
  ast.velocity = { (coord_gen(gen) - 64.0f) / 32.0f, (coord_gen(gen) - 64.0f) / 32.0f };
  ast.rotation_velocity = (coord_gen(gen) - 64.0f) / 32.0f;
  ast.position = coord;
  ast.ver = 0;
  ast.id = id_max_++;
  ast.last_update = GetServerTime_();
  ast.origin_time = GetServerTime_() - coord_gen(gen) / 8.0f;


  chunk.InsertAsteroid(ast);
}

void WorldSim::FixChunkBoundaries(Point2D<int>& chunk) {
  if (chunk.x >= chunk_dims_ || chunk.x < 0 || chunk.y >= chunk_dims_ || chunk.y < 0) {
    chunk.x -= std::floor(chunk.x / static_cast<double>(chunk_dims_)) * chunk_dims_;
    chunk.y -= std::floor(chunk.y / static_cast<double>(chunk_dims_)) * chunk_dims_;
  }
}

Napi::Value WorldSim::GetServerTime(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), GetServerTime_());
}

double WorldSim::GetServerTime_() {
  auto now = std::chrono::high_resolution_clock::now();
  return std::chrono::duration<double>(now - origin_time_).count();
}

#ifdef WORLD_EXPORT

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = WorldSim::GetClassInstance(env);
  exports.Set("sim", func);
  return exports;
}

NODE_API_MODULE(worldsim, Init);

#endif

}
}