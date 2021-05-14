#include <server/BiomeManager.hpp>

#include <cstdlib>

namespace vasteroids {
namespace server {

BiomeManager::BiomeManager(int chunk_dims, int biome_count) : chunk_dims_(chunk_dims), generator_(std::rand()) {
  chunks_ = std::uniform_int_distribution<int>(0, chunk_dims_ - 1);
  biomes_ = std::uniform_int_distribution<int>(1, static_cast<int>(Biome::BLACKHOLE));
  biome_fudge_ = std::uniform_real_distribution<double>(0.8, 1.2);
  // scatter some number of "biome points" on our grid
  // use a simple algo to find closest one
  // assign biome based on it
  // add to a counter, and add the respective float value to our biome tree alongside the chunk
  biome_map_ = new Biome*[chunk_dims_];
  for (int i = 0; i < chunk_dims_; i++) {
    biome_map_[i] = new Biome[chunk_dims_];
  }
  
  Point2D<int>* biome_origins = new Point2D<int>[biome_count];
  Biome* biomes = new Biome[biome_count];
  Point2D<int> temp;
  for (int i = 0; i < biome_count; i++) {
    temp.x = chunks_(generator_);
    temp.y = chunks_(generator_);
    biome_origins[i] = temp;
    biomes[i] = static_cast<Biome>(biomes_(generator_));
  }

  prob_sum_ = 0.0;

  Biome biome = Biome::NORMAL;
  float dist;
  float d_cur;
  for (int i = 0; i < chunk_dims_; i++) {
    for (int j = 0; j < chunk_dims_; j++) {
      dist = chunk_dims_ * chunk_dims_ * 4;

      for (int k = 0; k < biome_count; k++) {
        temp = biome_origins[k];
        d_cur = GetDistanceSquared(temp, {i, j});
        if (d_cur < dist) {
          dist = d_cur;
          biome = biomes[k];
        }
      }

      // biome_map[x][y] stores the type of chunk (x, y)
      biome_map_[i][j] = biome;
      biome_prob_tree_.Insert(prob_sum_, {i, j});
      prob_sum_ += GetBiomeWeight(biome);
    }
  }

  for (int i = 0; i < chunk_dims_; i++) {
    for (int j = 0; j < chunk_dims_; j++) {
      switch (biome_map_[i][j]) {
        case Biome::NORMAL:
          std::cout << "N";
          break;
        case Biome::BARREN:
          std::cout << "B";
          break;
        case Biome::BLACKHOLE:
          std::cout << "H";
          break;
        case Biome::NEBULA:
          std::cout << "E";
          break;
        case Biome::ASTEROIDFIELD:
          std::cout << "A";
          break;
        case Biome::INVALID:
          std::cout << "?";
          break;
      }
    }
    std::cout << std::endl;
  }

  biome_picker_ = std::uniform_real_distribution<double>(0.0, prob_sum_);

  delete[] biome_origins;
  delete[] biomes;
}

Biome BiomeManager::GetBiome(Point2D<int> chunk) {
  // wrap handling
  if (chunk.x < 0 || chunk.x >= chunk_dims_ || chunk.y < 0 || chunk.y >= chunk_dims_) {
    chunk.x -= (std::floor(static_cast<float>(chunk.x) / chunk_dims_)) * chunk_dims_;
    chunk.y -= (std::floor(static_cast<float>(chunk.y) / chunk_dims_)) * chunk_dims_;
  }

  return biome_map_[chunk.x][chunk.y];
}

Point2D<int> BiomeManager::GetRandomChunk() {
  double seed = biome_picker_(generator_);
  Point2D<int> res;
  biome_prob_tree_.Lookup(seed, &res);
  return res;
}

BiomeManager::~BiomeManager() {
  for (int i = 0; i < chunk_dims_; i++) {
    delete[] biome_map_[i];
  }

  delete[] biome_map_;
}

float BiomeManager::GetDistanceSquared(const Point2D<int>& a, const Point2D<int>& b) {
  Point2D<int> res = b - a;
  if (res.x > chunk_dims_ / 2) {
    res.x -= chunk_dims_;
  } else if (res.x < -chunk_dims_ / 2) {
    res.x += chunk_dims_;
  }

  if (res.y > chunk_dims_ / 2) {
    res.y -= chunk_dims_;
  } else if (res.y < -chunk_dims_ / 2) {
    res.y += chunk_dims_;
  }

  return static_cast<float>(res.x * res.x + res.y * res.y);
}

double BiomeManager::GetBiomeWeight(const Biome& b) {
  double weight;
  switch(b) {
    case Biome::NORMAL:
    default:
      weight = 1.0;
      break;
    case Biome::BARREN:
      weight = 0.4;
      break;
    case Biome::ASTEROIDFIELD:
      weight = 2.0;
      break;
    case Biome::NEBULA:
      weight = 1.75;
      break;
    case Biome::BLACKHOLE:
      weight = 2.5;
      break;
  }

  weight *= biome_fudge_(generator_);
  return weight;
}

}
}