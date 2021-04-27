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
  public widthScaleBase: number;
  private canvas: VectorCanvas;
  private dims: number;

  constructor(widthScale: number, canvas: VectorCanvas, dims: number) {
    this.widthScaleBase = widthScale;
    this.canvas = canvas;
    this.dims = dims;
  }

  drawInstances(player: ClientShip, instances: ServerPacket) {
    let screen = {
      x: this.canvas.getWidth(),
      y: this.canvas.getHeight()
    };

    let ratio = screen.x / screen.y;
    if (ratio > 1) {
      this.widthScale = this.widthScaleBase * ratio;
    } else {
      this.widthScale = this.widthScaleBase;
    }


    this.drawGrid(player.position, 0.5, 0.5, [0.1, 0.1, 0.1, 1.0]);
    this.drawGrid(player.position, 1.0, 1.0, [0.2, 0.2, 0.2, 1.0]);

    // draw ship
    this.drawGeometry(player.position, player.position, shipGeom, -player.rotation);

    for (let a of instances.asteroids) {
      if (a.hidden) {
        continue;
      }

      this.drawGeometry(player.position, a.position, a.geometry, -a.rotation);
      let k = this.toScreenPosition(player.position, a.position);
    }

    for (let s of instances.ships) {
      if (s.hidden) {
        continue;
      }

      this.drawGeometry(player.position, s.position, shipGeom, -s.rotation);
      let shipPos = this.toScreenPosition(player.position, s.position);
      shipPos.x += 24;
      shipPos.y += 24;

      this.canvas.addText(shipPos.x, shipPos.y, s.name + `: ${s.score}`, 2, [8, 8]);
    }

    let score = player.score.toString();
    let len = score.length;
    this.canvas.addText(screen.x - 40 - (len * 30), screen.y - 60, score, 2, [24, 24]);

    let chunk = `chunk: ${player.position.chunk.x}, ${player.position.chunk.y}`;
    let position = `pos: ${player.position.position.x.toFixed(2)}, ${player.position.position.y.toFixed(2)}`;

    this.canvas.addText(16, 16, chunk, 2, [12, 12]);
    this.canvas.addText(16, 46, position, 2, [12, 12]);

    for (let p of instances.projectiles) {
      if (p.hidden) {
        continue;
      }
      this.drawGeometry(player.position, p.position, [
        {
          x: -0.1,
          y: 0
        },
        {
          x: 0.1,
          y: 0
        }
      ], -p.rotation)
    }

    this.canvas.drawToScreen();
  }

  private drawGrid(center: WorldPosition, step: number, speed: number, color: [number, number, number, number]) {
    let widthStep = step * this.canvas.getWidth() / (this.widthScale);
    let posCenter = center.position.x * speed / step;

    let widthOffV = (posCenter % GRIDSTEP) * widthStep;
    let shipCenter = {
      x: this.canvas.getWidth() / 2,
      y: this.canvas.getHeight() / 2
    };

    let gridColor : [number, number, number, number] = [0.3, 0.3, 0.3, 1.0];

    let gridLineX = shipCenter.x - widthOffV;
    while (gridLineX > 0) {
      gridLineX -= widthStep;
    }

    gridLineX += widthStep;
    while (gridLineX < this.canvas.getWidth()) {
      this.canvas.addLine(gridLineX, -1, gridLineX, this.canvas.getHeight() + 1, 2, color);
      gridLineX += widthStep;
    }

    let widthOffH = ((center.position.y * speed / step) % GRIDSTEP) * widthStep;
    let gridLineY = shipCenter.y - widthOffH;
    while (gridLineY > 0) {
      gridLineY -= widthStep;
    }

    gridLineY += widthStep;
    while (gridLineY < this.canvas.getHeight()) {
      this.canvas.addLine(-1, gridLineY, this.canvas.getWidth() + 1, gridLineY, 2, color);
      gridLineY += widthStep;
    }
  }

  toScreenPosition(center: WorldPosition, pos: WorldPosition) : Point2D {
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

    let posDelta = {
      x: (wp.position.x - center.position.x),
      y: (wp.position.y - center.position.y)
    } as Point2D;

    if (posDelta.x > (this.dims * chunkSize) / 2) {
      posDelta.x -= this.dims * chunkSize;
    } else if (posDelta.x < -(this.dims * chunkSize) / 2) {
      posDelta.x += this.dims * chunkSize;
    }

    if (posDelta.y > (this.dims * chunkSize) / 2) {
      posDelta.y -= this.dims * chunkSize;
    } else if (posDelta.y < -(this.dims * chunkSize) / 2) {
      posDelta.y += this.dims * chunkSize;
    }

    // center of our geometry on screen
    let posScreen = {
      x: screenCenter.x + posDelta.x * widthStep,
      y: screenCenter.y + posDelta.y * widthStep
    };

    return posScreen;
  }

  // draws geom onto screen rel. to center point
  private drawGeometry(center: WorldPosition, pos: WorldPosition, geom: Array<Point2D>, rot: number) {
    // find pos relative to center based on widthscale
    let widthStep = this.canvas.getWidth() / this.widthScale;
    let posScreen = this.toScreenPosition(center, pos);

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