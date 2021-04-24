import { CreateWorldSim } from "../server/WorldSim";
import { ClientShip } from "../instances/Ship";
import { expect } from "chai";
import { InstanceType, Point2D } from "../instances/GameTypes";
import { ClientPacket } from "../server/ClientPacket";

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
    expect(id).to.equal(2);
    console.log("beginning update...");
    let pkts = worldsim.UpdateSim();

    console.log(pkts);
    console.log(pkts['2'].asteroids);

    expect(pkts['2'].asteroids.length).to.equal(1);
    expect(pkts['2'].ships.length).to.equal(0);
    expect(pkts['2'].deltas.length).to.equal(0);

    let ship_two = worldsim.AddShip("dingusville_two");
    expect(ship_two.name).to.equal("dingusville_two");
    expect(ship_two.id).to.equal(3);

    pkts = worldsim.UpdateSim();
    console.log(pkts);
    expect(pkts['3']).to.not.be.undefined;
    expect(pkts['2']).to.not.be.undefined;

    expect(pkts['2'].asteroids.length).to.equal(0);
    expect(pkts['3'].asteroids.length).to.equal(1);

    expect(pkts['2'].deltas.length).to.equal(0);

    expect(pkts['2'].ships.length).to.equal(1);
    expect(pkts['2'].ships[0].name).to.equal("dingusville_two");

    expect(pkts['3'].ships.length).to.equal(1);
    expect(pkts['3'].ships[0].name).to.equal("dingusville");

    pkts = worldsim.UpdateSim();
    console.log(pkts);
    expect(pkts['3']).to.not.be.undefined;
    expect(pkts['2']).to.not.be.undefined;

    expect(pkts['2'].asteroids.length).to.equal(0);
    expect(pkts['3'].asteroids.length).to.equal(0);

    expect(pkts['2'].ships.length).to.equal(0);
    expect(pkts['3'].ships.length).to.equal(0);

    expect(pkts['2'].deltas.length).to.equal(0);
    expect(pkts['3'].deltas.length).to.equal(0);
  });

  it("should allow clients to update their position", function() {
    let worldsim = CreateWorldSim(4, 0);
    let ship_one = worldsim.AddShip("ship1");
    let testClientPacket = {} as ClientPacket;
    // modify ship one
    ship_one.position.chunk = {x: 0, y: 0} as Point2D;
    testClientPacket.ship = ship_one;
    testClientPacket.projectiles = [];
    let ship_two = worldsim.AddShip("ship2");
    let testTwo = {} as ClientPacket;
    
    ship_two.position.chunk = {x: 0, y: 0} as Point2D;
    testTwo.ship = ship_two;
    testTwo.projectiles = [];

    console.log("one!");
    console.log(testClientPacket.ship);
    worldsim.HandleClientPacket(testClientPacket);
    console.log("two!");
    worldsim.HandleClientPacket(testTwo);

    let res = worldsim.UpdateSim();
    console.log(res);
    expect(res[ship_one.id.toString()].ships.length).to.equal(1);
    expect(res[ship_two.id.toString()].ships.length).to.equal(1);

    // move ship2 to the other side of the earth
    ship_two.position.chunk = {x: 2, y: 2} as Point2D;
    testTwo.ship = ship_two;
    testTwo.projectiles = [];

    worldsim.HandleClientPacket(testTwo);
    
    res = worldsim.UpdateSim();
    console.log(res);
    expect(res[ship_one.id.toString()].ships.length).to.equal(0);
    expect(res[ship_two.id.toString()].ships.length).to.equal(0);

    // move ship1 to ship2
    ship_one.position.chunk = {x: 2, y: 2} as Point2D;
    testClientPacket.ship = ship_one;
    testClientPacket.projectiles = [];

    worldsim.HandleClientPacket(testClientPacket);

    res = worldsim.UpdateSim();
    console.log(res);
    expect(res[ship_one.id.toString()].ships.length).to.equal(1);
    expect(res[ship_two.id.toString()].ships.length).to.equal(1);

    worldsim.DeleteShip(ship_two.id);
    res = worldsim.UpdateSim();
    console.log(res);
    expect(res[ship_two.id.toString()]).to.be.undefined;
    expect(res[ship_one.id.toString()].deleted.length).to.equal(1);
  })
})