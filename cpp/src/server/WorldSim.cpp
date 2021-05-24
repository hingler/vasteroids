#include <server/WorldSim.hpp>
#include <client/ClientPacket.hpp>

#include <BiomeInfo.hpp>

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
    InstanceMethod("RespawnShip", &WorldSim::RespawnShip),
    InstanceMethod("AddShip", &WorldSim::AddShip),
    InstanceMethod("DeleteShip", &WorldSim::DeleteShip),
    InstanceMethod("GetServerTime", &WorldSim::GetServerTime),
    InstanceMethod("GetLocalBiomeInfo", &WorldSim::GetLocalBiomeInfo)
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

  // pot. costly, but then again we only really have to do it once
  mgr = std::make_shared<BiomeManager>(chunk_dims_, ((chunk_dims_ * chunk_dims_) / 36));

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
  velo_gen = std::uniform_real_distribution<float>(-1.8f, 1.8f);

  WorldPosition temp;
  for (int i = 0; i < asteroids; i++) {
    temp.chunk = mgr->GetRandomChunk();
    temp.position.x = coord_gen(gen);
    temp.position.y = coord_gen(gen);

    SpawnNewAsteroid(temp);
  }

  asteroid_count_ = asteroids;
  asteroid_min_ = asteroids;
}

Napi::Value WorldSim::GetChunkDims(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), chunk_dims_);
}

Napi::Value WorldSim::HandleClientPacket(const Napi::CallbackInfo& info) {
  bool destroyed = false;
  Napi::Env env = info.Env();
  Napi::Value packetObj = info[0];
  if (!packetObj.IsObject()) {
    TYPEERROR_RETURN_UNDEF(env, "argument to `HandleClientPacket` is not a ClientPacket!");
  }


  ClientPacket packet(packetObj.As<Napi::Object>());
  if (env.IsExceptionPending()) {
    return env.Undefined();
  }

  // find old ship record
  auto ship_old = ships_.find(packet.client_ship.id);
  if (ship_old == ships_.end()) {
    TYPEERROR_RETURN_UNDEF(env, "Updated ship does not exist!");
  }

  Point2D<int> chunk = ship_old->second;

  // ships might enter chunks which have yet to be occupied
  auto c = chunks_.find(chunk);
  if (c == chunks_.end()) {
    TYPEERROR_RETURN_UNDEF(env, "Invariant not maintained -- ship does not exist in chunk!");
  }

  // we update "destroyed" here.
  auto& ship_new = packet.client_ship;

  {
    // update ver number
    // we're grabbing this ship from the chunk we *think* has it
    // but that chunk has since moved
    Ship* ship_last = c->second.GetShip(packet.client_ship.id);
    destroyed = (ship_new.destroyed && !ship_last->destroyed);
    ship_new.ver = ship_last->ver + 1;
    // update score lole
    ship_new.score = ship_last->score;
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

  if (destroyed) {
    Collision c;
    c.id = id_max_++;
    c.creation_time = GetServerTime_();
    c.velocity.x = 0;
    c.velocity.y = 0;
    c.position = ship_new.position;
    c.rotation = 0;
    c.rotation_velocity = 0;
    c.last_update = GetServerTime_();
    c.origin_time = GetServerTime_() - coord_gen(gen) / 8.0f;
    chunks_.at(new_chunk).InsertCollision(c);
  }

  // update ships list to match new chunk
  ships_.erase(ship_new.id);
  ships_.insert(std::make_pair(ship_new.id, new_chunk));

  // if the ship is destroyed, we should start ignoring these
  if (packet.projectiles.size() > 4) {
    std::cout << "something funny is going on" << std::endl;
  }
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
  CorrectChunk(proj);
  proj.id = id_max_++;
  proj.ship_ID = ship_id;
  proj.origin_time = GetServerTime_() - coord_gen(gen) / 8.0f;
  // creation time is subject to client lag :(
  // use origin position to figure out delta
  Point2D<float> distFromOrigin = GetDistance(proj.origin, proj.position);
  proj.creation_time = GetServerTime_();
  new_projectiles_.at(ship_id).insert(proj.client_ID);
  Point2D<int> new_chunk = proj.position.chunk;
  if (chunks_.find(new_chunk) == chunks_.end()) {
    CreateChunk(new_chunk);
  }

  chunks_.at(new_chunk).InsertProjectile(proj);
}

Point2D<float> WorldSim::GetDistance(WorldPosition a, WorldPosition b) {
  Point2D<int> chunkDist{b.chunk.x - a.chunk.x, b.chunk.y - a.chunk.y};
  Point2D<float> posDist{b.position.x - a.position.x, b.position.y - a.position.y};

  posDist.x += (chunkDist.x * chunk_size);
  posDist.y += (chunkDist.y * chunk_size);

  if (posDist.x > (chunk_size * chunk_dims_) / 2) {
    posDist.x -= (chunk_size * chunk_dims_);
  } else if (posDist.x < -(chunk_size * chunk_dims_) / 2) {
    posDist.x += (chunk_size * chunk_dims_);
  }

  if (posDist.y > (chunk_size * chunk_dims_) / 2) {
    posDist.y -= (chunk_size * chunk_dims_);
  } else if (posDist.y < -(chunk_size * chunk_dims_) / 2) {
    posDist.y += (chunk_size * chunk_dims_);
  }

  return posDist;
}

std::unordered_set<Point2D<int>> WorldSim::GetActiveChunks() {
  std::unordered_set<Point2D<int>> res;
  for (auto ship : ships_) {
    for (int x = ship.second.x - 1; x <= ship.second.x + 1; x++) {
      for (int y = ship.second.y - 1; y <= ship.second.y + 1; y++) {
        Point2D<int> chunk(x, y);
        FixChunkBoundaries(chunk);

        res.insert(chunk);
      }
    }
  }

  return res;
}

void WorldSim::ReinsertInstances(ServerPacket& collate) {
  double server_time = GetServerTime_();
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
}

Napi::Value WorldSim::UpdateSim(const Napi::CallbackInfo& info) {
  // update all components
  // figure out which chunks we need to update
  double server_time = GetServerTime_();
  Napi::Env env = info.Env();
  Napi::Object obj_ret = Napi::Object::New(env);
  std::unordered_set<Point2D<int>> update_chunks = GetActiveChunks();

  ServerPacket collate;

  // it would be nice to keep these outskirt chunks updated, but there is no reliable way to do it
  // maybe push it onto a separate thread?

  // create a component which scours our chunk list and just updates one whenever it can
  // aim for an update rate of ~1 / sec
  // caveat: we have to put a lock on each chunk
  // no collision testing, just updates.
  for (auto point : update_chunks) {
    if (!chunks_.count(point)) {
      // chunk currently contains no items -- do not update it.
      continue;
    }

    chunks_.at(point).UpdateChunk(collate, server_time);
  }

  ReinsertInstances(collate);

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
    // we need to update this collision delta :(
    // we insert a copy though, so it's OK to do here.
    chunks_.at(p.position.chunk).GetProjectile(p.id)->last_collision_delta = p.last_update;
    chunks_.at(p.position.chunk).GetProjectile(p.id)->origin = p.position;
  }

  std::unordered_map<uint64_t, Point2D<int>> deleted;
  std::vector<std::pair<WorldPosition, float>> collide_pos;

  auto client_map = cw_->ComputeCollisions(deleted, collide_pos);
  for (auto& del : deleted) {
    Projectile* proj = chunks_.at(del.second).GetProjectile(del.first);
    if (proj) {
      uint64_t client = proj->ship_ID;
      if (ships_.count(client)) {
        Point2D<int> pt = ships_.at(client);
        chunks_.at(pt).GetShip(client)->score += 10;
      }
    }
    chunks_.at(del.second).RemoveInstance(del.first);
    asteroid_count_--;
  }

  for (auto& pos : collide_pos) {
    SpawnNewAsteroid(pos.first, pos.second, 12);
    SpawnNewAsteroid(pos.first, pos.second, 12);
    asteroid_count_ += 2;
  }

  WorldPosition temp;
  while (asteroid_count_ < asteroid_min_) {
    do {
      temp.chunk.x = static_cast<int>(std::round(chunk_gen(gen)));
      temp.chunk.y = static_cast<int>(std::round(chunk_gen(gen)));
    } while (temp.chunk.x < 0 || temp.chunk.x >= chunk_dims_
          || temp.chunk.y < 0 || temp.chunk.y >= chunk_dims_);

    temp.position.x = coord_gen(gen);
    temp.position.y = coord_gen(gen);

    SpawnNewAsteroid(temp);
    asteroid_count_++;
  }

  // lastly, we need to figure out which entities to expose to which instances

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
    int asteroid_count = 0;
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
        if (knowns.at(itr_a->id) != itr_a->ver) {
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
        // worry about new asteroids only
        if (asteroid_count > 32) {
          // erase it anyway
          // remove it from knowns
          knowns_new.erase(itr_a->id);
          itr_a = res.asteroids.erase(itr_a);
        } else {
          asteroid_count++;
          itr_a++;
        }
      }
    }

    auto* proj_new = &new_projectiles_.at(id);
    auto itr_p = res.projectiles.begin();
    while (itr_p != res.projectiles.end()) {
      if (deleted.count(itr_p->id)) {
        res.deleted.insert(itr_p->id);
        if (proj_new->count(itr_p->client_ID) && itr_p->ship_ID == id) {
          res.deleted_local.insert(itr_p->client_ID);
        }
        itr_p = res.projectiles.erase(itr_p);
        continue;
      }
      if (proj_new->count(itr_p->client_ID) && itr_p->ship_ID == id) {
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
    
    auto itr_s = res.ships.begin();
    while (itr_s != res.ships.end()) {
      if (itr_s->id == id) {
        itr_s = res.ships.erase(itr_s);
      } else {
        itr_s++;
      }
    }

    auto itr_c = res.collisions.begin();
    while (itr_c != res.collisions.end()) {
      knowns_new.insert(std::make_pair(itr_c->id, itr_c->ver));
      if (knowns.count(itr_c->id)) {
        if (knowns.at(itr_c->id) != itr_c->ver) {
          delta_pkt.id = itr_c->id;
          delta_pkt.position = itr_c->position;
          delta_pkt.velocity = itr_c->velocity;
          delta_pkt.rotation = itr_c->rotation;
          delta_pkt.rotation_velocity = itr_c->rotation_velocity;
          delta_pkt.last_update = itr_c->last_update;
          res.deltas.push_back(std::move(delta_pkt));
        }

        itr_c = res.collisions.erase(itr_c);
      } else {
        itr_c++;
      }
    }

    res.server_time = server_time;
    if (client_map.count(id)) {
      for (auto& pr : client_map.at(id)) {
        res.deleted_local.insert(pr);
      }
    }

    res.score = chunks_.at(ship.second).GetShip(id)->score;

    // everything in knowns which is not in knowns_new should be marked as deleted -- either it's out of scope, or completely gone.
    for (auto& id : knowns) {
      if (!knowns_new.count(id.first)) {
        res.deleted.insert(id.first);
      }
    }
    known_ids_.erase(id);
    known_ids_.insert(std::make_pair(id, std::move(knowns_new)));
    std::string id_str = std::to_string(id);
    obj_ret.Set(std::move(id_str), res.ToNodeObject(env));
  }

  return obj_ret;
}

Napi::Value WorldSim::RespawnShip(const Napi::CallbackInfo& info) {
  // accept a ship ID
  // return either a new ship, or undefined.
  // former contains the new ship state if valid, latter indicates game over.
  Napi::Env env = info.Env();
  Napi::Value id = info[0];
  if (!id.IsNumber()) {
    TYPEERROR_RETURN_UNDEF(env, "no ID given!");
  }

  uint64_t id_int = id.As<Napi::Number>().Int64Value();


  if (!ships_.count(id_int)) {
    // bad id!
    return env.Undefined();
  }

  Point2D<int>& chunk = ships_.at(id_int);
  Chunk& c = chunks_.at(chunk);
  Ship s = *c.GetShip(id_int);
  if (s.lives == 0) {
    return env.Undefined();
  }

  s.lives--;
  SpawnShip(s);
  return s.ToNodeObject(env);
}

void WorldSim::SpawnShip(Ship& s) {
  do {
    s.position.chunk.x = static_cast<int>(chunk_gen(gen));
    s.position.chunk.y = static_cast<int>(chunk_gen(gen));
  } while (s.position.chunk.x < 0 || s.position.chunk.x >= chunk_dims_
        || s.position.chunk.y < 0 || s.position.chunk.y >= chunk_dims_);

  if (!chunks_.count(s.position.chunk)) {
    CreateChunk(s.position.chunk);
  }

  s.position.position.x = coord_gen(gen);
  s.position.position.y = coord_gen(gen);

  s.velocity = {0.0f, 0.0f};
  s.rotation = 0.0f;
  s.rotation_velocity = 0.0f;
  s.last_update = GetServerTime_();
  // the client will un-destroy the ship
  // if we fix it now, something will desync
}

Napi::Value WorldSim::AddShip(const Napi::CallbackInfo& info) {
  Napi::Env env =  info.Env();
  Napi::Value val = info[0];
  if (!val.IsString()) {
    TYPEERROR_RETURN_UNDEF(env, "`name` is not a string!");
  }

  Ship s;
  // get name for this ship
  s.name = val.As<Napi::String>().Utf8Value();
  // add entries for our new ship
  do {
    s.position.chunk.x = static_cast<int>(chunk_gen(gen));
    s.position.chunk.y = static_cast<int>(chunk_gen(gen));
  } while (s.position.chunk.x < 0 || s.position.chunk.x >= chunk_dims_
        || s.position.chunk.y < 0 || s.position.chunk.y >= chunk_dims_);

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
  s.score = 0;
  s.last_update = GetServerTime_();
  s.origin_time = GetServerTime_() - coord_gen(gen) / 8.0f;

  s.lives = 3;
  s.destroyed = false;
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
    TYPEERROR_RETURN_UNDEF(env, "param is not a number!");
  }

  uint64_t id = static_cast<uint64_t>(val.As<Napi::Number>().Int64Value());
  // remove from chunk
  if (!ships_.count(id)) {
    return Napi::Boolean::New(env, false);
  }

  if (!chunks_.at(ships_.at(id)).RemoveInstance(id)) {
    TYPEERROR_RETURN_UNDEF(env, "invariant broken: ship not present in chunk!");
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
  // TODO: we should look up chunks' biomes here
  ast.velocity = { (coord_gen(gen) - ((chunk_size) / 2)) / ((chunk_size) / 4), (coord_gen(gen) - ((chunk_size) / 2)) / ((chunk_size) / 4) };
  ast.rotation_velocity = (coord_gen(gen) - ((chunk_size) / 2)) / ((chunk_size) / 4);
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

Napi::Value WorldSim::GetLocalBiomeInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  // get each chunk in specified area
  // append to big long array
  // return that
  Napi::Value origin = info[0];
  Napi::Value dims = info[1];

  if (!origin.IsObject() || !dims.IsObject()) {
    TYPEERROR_RETURN_UNDEF(env, "Arguments to `GetLocalBiomeInfo` not correct");
  }

  Point2D<int> pt_origin(origin.As<Napi::Object>());
  Point2D<int> pt_dims(dims.As<Napi::Object>());

  pt_dims.x = std::min(32, pt_dims.x);
  pt_dims.y = std::min(32, pt_dims.y);

  Napi::Array res = Napi::Array::New(env);
  int chunks = 0;
  BiomeInfo temp_info;
  for (int i = 0; i < pt_dims.x; i++) {
    for (int j = 0; j < pt_dims.y; j++) {
      temp_info.chunk.x = (i + pt_origin.x);
      temp_info.chunk.y = (j + pt_origin.y);
      temp_info.biome = mgr->GetBiome(temp_info.chunk);
      res[chunks++] = temp_info.ToNodeObject(env);
    }
  }

  return res;
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