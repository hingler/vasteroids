import { Point2D } from "./GameTypes";

export enum Biome {
  NORMAL = 1,
  BARREN = 2,
  ASTEROIDFIELD = 3,
  NEBULA = 4,
  BLACKHOLE = 5,
  INVALID = 6
};

export function biomeToString(b: Biome) {
  switch(b) {
    case Biome.NORMAL:
      return "normal";
    case Biome.BARREN:
      return "barren";
    case Biome.ASTEROIDFIELD:
      return "asteroid field";
    case Biome.NEBULA:
      return "nebula";
    case Biome.BLACKHOLE:
      return "blackhole";
    case Biome.INVALID:
    default:
      return "invalid";
  }
}

export interface BiomeInfo {
  chunk: Point2D;
  biome: Biome;
}