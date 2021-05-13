import { Point2D } from "./GameTypes";

export enum Biome {
  NORMAL = 1,
  BARREN = 2,
  ASTEROIDFIELD = 3,
  NEBULA = 4,
  BLACKHOLE = 5,
  INVALID = 6
};

export interface BiomeInfo {
  chunk: Point2D;
  biome: Biome;
}