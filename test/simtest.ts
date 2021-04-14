import { CreateWorldSim } from "../server/WorldSim";
import { ClientShip } from "../instances/Ship";
import { expect } from "chai";
import { InstanceType } from "../instances/GameTypes";

describe("WorldSim", function() {
  it("Should be able to be created :)", function() {
    let worldsim = CreateWorldSim(1, 1);
    expect(worldsim.GetChunkDims()).to.equal(1);
  });

  it("Should return updates containing local features", function() {
    let worldsim = CreateWorldSim(1, 1);
    let ship = worldsim.AddShip("dingusville");
    expect(ship.name).to.equal("dingusville");
    let id = ship.id;
    expect(id).to.equal(1);
    console.log("beginning update...");
    let pkts = worldsim.UpdateSim();

    console.log(pkts);

    expect(pkts['1'].asteroids.length).to.equal(1);
    expect(pkts['1'].ships.length).to.equal(0);
    expect(pkts['1'].deltas.length).to.equal(0);

    let ship_two = worldsim.AddShip("dingusville_two");
    expect(ship_two.name).to.equal("dingusville_two");
    expect(ship_two.id).to.equal(2);

    pkts = worldsim.UpdateSim();
    console.log(pkts);
    expect(pkts['2']).to.not.be.undefined;
    expect(pkts['1']).to.not.be.undefined;

    expect(pkts['1'].asteroids.length).to.equal(0);
    expect(pkts['2'].asteroids.length).to.equal(1);

    expect(pkts['1'].deltas.length).to.equal(0);

    expect(pkts['1'].ships.length).to.equal(1);
    expect(pkts['1'].ships[0].name).to.equal("dingusville_two");

    expect(pkts['2'].ships.length).to.equal(1);
    expect(pkts['2'].ships[0].name).to.equal("dingusville");

    pkts = worldsim.UpdateSim();
    console.log(pkts);
    expect(pkts['2']).to.not.be.undefined;
    expect(pkts['1']).to.not.be.undefined;

    expect(pkts['1'].asteroids.length).to.equal(0);
    expect(pkts['2'].asteroids.length).to.equal(0);

    expect(pkts['1'].ships.length).to.equal(0);
    expect(pkts['2'].ships.length).to.equal(0);

    expect(pkts['1'].deltas.length).to.equal(0);
    expect(pkts['2'].deltas.length).to.equal(0);
  });
})