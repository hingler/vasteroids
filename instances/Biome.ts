import { Point2D } from "./GameTypes";

export enum Biome {
  NORMAL = "normal",
  BARREN = "barren",
  ASTEROIDFIELD = "asteroidfield",
  NEBULA = "nebula",
  BLACKHOLE = "blackhole",
  INVALID = "invalid"
};

export interface BiomeInfo {
  chunk: Point2D;
  biome: Biome;
}