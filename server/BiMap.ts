interface Entry <T, U> {
  t: T;
  u: U;
};

class BiMap<T, U> {
  mapTU: Map<T, U>;
  mapUT: Map<U, T>;

  constructor() {
    this.mapTU = new Map();
    this.mapUT = new Map();
  }

  insert(keyT: T, keyU: U) : void {
    this.mapTU.set(keyT, keyU);
    this.mapUT.set(keyU, keyT);
  }

  getEntryT(tKey: T) : U {
    let val = this.mapTU.get(tKey);
    if (val) {
      return val;
    }

    return null;
  }

  getEntryU(uKey: U) : T {
    let val = this.mapUT.get(uKey);
    if (val) {
      return val;
    }

    return null;
  }

  removeT(keyT: T) : U {
    let keyU = this.mapTU.get(keyT);
    if (keyU) {
      this.mapUT.delete(keyU);
      this.mapTU.delete(keyT);
      return keyU;
    }
    
    return null;
  }

  removeU(keyU: U) : T {
    let keyT = this.mapUT.get(keyU);
    if (keyT) {
      this.mapTU.delete(keyT);
      this.mapUT.delete(keyU);
      return keyT;
    }

    return null;
  }

  *[Symbol.iterator]() {
    for (let ent of this.mapTU) {
      yield ent;
    }
  }

  keysT() : IterableIterator<T> {
    return this.mapTU.keys();
  }

  keysU() : IterableIterator<U> {
    return this.mapUT.keys();
  }
}

export { BiMap, Entry };