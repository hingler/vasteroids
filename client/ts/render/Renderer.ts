import { chunkSize, Point2D, WorldPosition } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";
import { ServerPacket } from "../../../server/ServerPacket";
import { VectorCanvas } from "../gl/VectorCanvas";

const GRIDSTEP = 2;

const shipGeom = [
  {
    x: 0.125,
    y: 0.0
  },

  {
    x: -0.05,
    y: -0.075
  },

  {
    x: -0.04,
    y: 0
  },

  {
    x: -0.05,
    y: 0.075
  }
];

/**
 * Renders components to the screen.
 */
export class Renderer {
  public widthScale: number;
  private canvas: VectorCanvas;

  constructor(widthScale: number, canvas: VectorCanvas) {
    this.widthScale = widthScale;
    this.canvas = canvas;
  }

  drawInstances(player: ClientShip, instances: ServerPacket) {
    // draw the ship
    let widthStep = this.canvas.getWidth() / this.widthScale;
    let posCenter = player.position.position.x;

    let widthOffV = (posCenter % GRIDSTEP) * widthStep;
    let shipCenter = {
      x: this.canvas.getWidth() / 2,
      y: this.canvas.getHeight() / 2
    };

    let gridLineX = shipCenter.x - widthOffV;
    while (gridLineX > 0) {
      gridLineX -= widthStep;
    }

    gridLineX += widthStep;
    while (gridLineX < this.canvas.getWidth()) {
      this.canvas.addLine(gridLineX, -1, gridLineX, this.canvas.getHeight() + 1, 1);
      gridLineX += widthStep;
    }

    let widthOffH = (player.position.position.y % GRIDSTEP) * widthStep;
    let gridLineY = shipCenter.y - widthOffH;
    while (gridLineY > 0) {
      gridLineY -= widthStep;
    }

    gridLineY += widthStep;
    while (gridLineY < this.canvas.getHeight()) {
      this.canvas.addLine(-1, gridLineY, this.canvas.getWidth() + 1, gridLineY, 1);
      gridLineY += widthStep;
    }

    // draw ship
    this.drawGeometry(player.position, player.position, shipGeom, -player.rotation);

    for (let a of instances.asteroids) {
      this.drawGeometry(player.position, a.position, a.geometry, -a.rotation);
    }

    for (let s of instances.ships) {
      this.drawGeometry(player.position, s.position, shipGeom, -s.rotation);
    }

    this.canvas.drawToScreen();
  }

  // draws geom onto screen rel. to center point
  private drawGeometry(center: WorldPosition, pos: WorldPosition, geom: Array<Point2D>, rot: number) {
    // find pos relative to center based on widthscale
    let widthStep = this.canvas.getWidth() / this.widthScale;

    let screenCenter = {
      x: this.canvas.getWidth() / 2,
      y: this.canvas.getHeight() / 2
    };

    let wp = {} as WorldPosition;

    wp.chunk = {} as Point2D;
    wp.position = {} as Point2D;
    
    // copy
    wp.chunk.x = pos.chunk.x;
    wp.chunk.y = pos.chunk.y;
    wp.position.x = pos.position.x;
    wp.position.y = pos.position.y;
    
    // fix chunk of pos to center
    let diffX = wp.chunk.x - center.chunk.x;
    let diffY = wp.chunk.y - center.chunk.y;
    wp.position.x += (diffX * chunkSize);
    wp.position.y += (diffY * chunkSize);

    // center of our geometry on screen
    let posScreen = {
      x: screenCenter.x + (wp.position.x - center.position.x) * widthStep,
      y: screenCenter.y + (wp.position.y - center.position.y) * widthStep
    };

    let geomRot : Array<Point2D> = [];

    for (let pt of geom) {
      let ptRot : Point2D = {
        x: pt.x,
        y: pt.y
      };

      ptRot.x = pt.x * Math.cos(rot) - pt.y * Math.sin(rot);
      ptRot.y = pt.x * Math.sin(rot) + pt.y * Math.cos(rot);
      // position relative to pos
      ptRot.x = posScreen.x + ptRot.x * widthStep;
      ptRot.y = posScreen.y + ptRot.y * widthStep;
      geomRot.push(ptRot);
    }

    for (let i = 0; i < geomRot.length; i++) {
      let a = geomRot[i];
      let b = geomRot[(i + 1) % geomRot.length];
      this.canvas.addLine(a.x, a.y, b.x, b.y, 2);
    }
  }
}