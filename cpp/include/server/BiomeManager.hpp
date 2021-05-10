#ifndef BIOME_MANAGER_H_
#define BIOME_MANAGER_H_

#include <server/BiomeTree.hpp>
#include <Biome.hpp>

#include <GameTypes.hpp>

#include <random>

namespace vasteroids {
namespace server {

/**
 *  BiomeManager maintains the biome type of all chunks,
 *  and helps determine where fresh asteroids should spawn.
 */ 
class BiomeManager {
 public:
  /**
   *  Creates a new biome manager, which tracks the biome assigned to each chunk.
   *  @param chunk_dims - the dimensions of our world, in chunks.
   *  @param biome_count - the number of biomes to spawn.
   */ 
  BiomeManager(int chunk_dims, int biome_count);

  /**
   *  @param chunk - the chunk whose biome we are fetching. Accounts for wrap.
   *  @returns the biome of the requested chunk.
   */ 
  Biome GetBiome(Point2D<int> chunk);

  /**
   *  @returns a random chunk to spawn an asteroid in.
   */ 
  Point2D<int> GetRandomChunk();

  ~BiomeManager();

  BiomeManager(const BiomeManager& other) = delete;
  BiomeManager(BiomeManager&& other) = delete;
  BiomeManager& operator=(const BiomeManager& other) = delete;
  BiomeManager& operator=(BiomeManager&& other) = delete;
 private:
  float GetDistanceSquared(const Point2D<int>& a, const Point2D<int>& b);
  double GetBiomeWeight(const Biome& b);
  const int chunk_dims_;
  Biome** biome_map_;

  double prob_sum_;

  std::mt19937 generator_;
  std::uniform_int_distribution<int> chunks_;
  std::uniform_int_distribution<int> biomes_;
  std::uniform_real_distribution<double> biome_fudge_;

  std::uniform_real_distribution<double> biome_picker_;

  BiomeTree<double, Point2D<int>> biome_prob_tree_;

};

}
}

#endif