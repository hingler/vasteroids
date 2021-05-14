import { biomeToString } from "../../../instances/Biome";
import { chunkSize, Point2D, WorldPosition } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";
import { ServerPacket } from "../../../server/ServerPacket";
import { AfterImage } from "../gl/material/AfterImage";
import { AfterOverlay } from "../gl/material/AfterOverlay";
import { TextureXfer } from "../gl/material/TextureXfer";
import { VectorCanvas } from "../gl/VectorCanvas";
import { VectorMesh2D } from "../gl/VectorMesh2D";
import { TouchInputManager } from "../input/TouchInputManager";
import { GetDistance, GetVector } from "../instance/AsteroidColliderJS";
import { GameStateManager } from "../instance/GameStateManager";
import { Framebuffer } from "./Framebuffer";

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

const pointerGeom = [
  {
    y: -0.4,
    x: -0.2
  },

  {
    y: 0.4,
    x: -0.2
  },

  {
    y: 0.4,
    x: 0.1
  },

  {
    y: 0.0,
    x: 0.3
  },

  {
    y: -0.4,
    x: 0.1
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
  private gl: WebGLRenderingContext;

  private fb_obj: Framebuffer;
  private fb_after_a: Framebuffer;
  private fb_after_b: Framebuffer;
  private framebuffer_phase: number;

  // stores geometry for frame tex -> screen (no blitframebuffer in WGL)
  private sexworld: VectorMesh2D;
  private cumplanet: TextureXfer;
  private aftrimage: AfterImage;
  private aftrovlay: AfterOverlay;

  private w: number;
  private h: number;

  constructor(widthScale: number, canvas: VectorCanvas, dims: number) {
    this.widthScaleBase = widthScale;
    this.canvas = canvas;
    this.dims = dims;

    
    this.w = this.canvas.getWidth();
    this.h = this.canvas.getHeight();
    
    let gl = this.canvas.gl;
    this.gl = gl;
    
    this.fb_obj = new Framebuffer(gl, this.w, this.h);
    this.fb_after_a = new Framebuffer(gl, this.w, this.h);
    this.fb_after_b = new Framebuffer(gl, this.w, this.h);

    this.framebuffer_phase = 0;

    this.w = this.canvas.getWidth(), this.h = this.canvas.getHeight();

    this.sexworld = new VectorMesh2D();
    this.sexworld.addVertex(-1, 1);
    this.sexworld.addVertex(1, 1);
    this.sexworld.addVertex(-1, -1);
    this.sexworld.addVertex(1, -1);
    this.sexworld.addTriangle(0, 1, 2);
    this.sexworld.addTriangle(2, 1, 3);

    this.cumplanet = new TextureXfer(this.gl);
    this.aftrimage = new AfterImage(this.gl);
    this.aftrovlay = new AfterOverlay(this.gl);
  }

  drawInstances(mgr: GameStateManager, inputmgr?: TouchInputManager) {
    let player = mgr.getShip();
    let instances = mgr.getInstances();
    let w = this.canvas.getWidth(), h = this.canvas.getHeight();
    if (w != this.w || h != this.h) {
      this.w = w, this.h = h;
      this.fb_obj.setFramebufferDimensions(w, h);
      this.fb_after_a.setFramebufferDimensions(w, h);
      this.fb_after_b.setFramebufferDimensions(w, h);
    }

    let gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    let ratio = this.w / this.h;
    if (ratio > 1) {
      this.widthScale = this.widthScaleBase * ratio;
    } else {
      this.widthScale = this.widthScaleBase;
    }

    this.drawGrid(player.position, 0.5, 0.5, [0.03, 0.03, 0.03, 1.0]);
    this.drawGrid(player.position, 1.0, 1.0, [0.09, 0.09, 0.09, 1.0]);

    // draw ship
    if (!player.destroyed) {
      let scale = (inputmgr ? 2 : 1);
      this.drawGeometry(player.position, player.position, shipGeom, -player.rotation, scale);
    }

    let astList = [];

    for (let a of instances.asteroids) {
      if (a.hidden) {
        continue;
      }

      let vec = GetVector(a, player.position, this.dims);
      let dist = vec.x * vec.x + vec.y * vec.y;
      
      this.drawGeometry(player.position, a.position, a.geometry, -a.rotation);

      let pos = this.toScreenPosition(player.position, a.position);

      if (pos.x > 0 && pos.x < this.w && pos.y > 0 && pos.y < this.h) {
        // asteroid is on screen -- don't bother trying to point to it.
        continue;
      }


      // dist bound from 6 to 30
      if (dist < 36 || dist > 900) {
        continue;
      }

      astList.push(a); 
    }
    
    // store distance info to avoid log complexity (soon)
    astList.sort((a, b) => {
      return (GetDistance(a, player.position, this.dims) < GetDistance(b, player.position, this.dims)) ? -1 : 1;
    });
    
    if (astList.length > 6) {
      astList = astList.slice(0, 6);
    }

    for (let ast of astList) {
      let vec = GetVector(ast, player.position, this.dims);
      // returned vec from asteroid to ship -- convert to ship -> asteroid.
      vec.x = -vec.x;
      vec.y = -vec.y;
      let dist = Math.sqrt(vec.x * vec.x + vec.y * vec.y);

      let scaleFac = (dist - 6) / 24;
      scaleFac = 1 - scaleFac;
      
      // normalize it
      vec.x /= dist;
      vec.y /= dist;

      let arrowPos : WorldPosition = {
        chunk: {
          x: player.position.chunk.x,
          y: player.position.chunk.y
        },

        position: {
          x: player.position.position.x + vec.x * (2 + scaleFac),
          y: player.position.position.y + vec.y * (2 + scaleFac)
        }
      };

      let rot = Math.atan2(vec.y, vec.x);

      this.drawGeometry(player.position, arrowPos, pointerGeom, rot, scaleFac / 1.8, [0.3, 0.3, 0.3, 1.0]);
    }

    for (let s of instances.ships) {
      if (s.hidden || s.destroyed) {
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
    this.canvas.addText(this.w - 40 - (len * 30), this.h - 60, score, 2, [24, 24]);

    let chunk = `chunk: ${player.position.chunk.x}, ${player.position.chunk.y}`;
    let position = `pos: ${player.position.position.x.toFixed(2)}, ${player.position.position.y.toFixed(2)}`;
    let biome = `biome: ${biomeToString(mgr.getCurrentBiome())}`;


    this.canvas.addText(16, 16, chunk, 2, [12, 12]);
    this.canvas.addText(16, 46, position, 2, [12, 12]);
    this.canvas.addText(16, 76, biome, 2, [12, 12]);

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

    // add lives
    let basePoint = {
      x: 48,
      y: this.h - 48
    };

    for (let i = 0; i < player.lives; i++) {
      this.DrawGeometryDirect(basePoint, shipGeom, [120, 120], -Math.PI / 2, 2);
      basePoint.x += 32;
    }

    if (player.lives === 0 && player.destroyed) {
      this.canvas.addText((this.w / 2) - 180, (this.h / 2) - 32, "GAME OVER", 2, [32, 32]);
    }

    if (inputmgr) {
      this.DrawCircle({x: 160, y: this.h - 192}, 128, 2, [1.0, 1.0, 1.0, 1.0]);
      this.DrawCircle({x: this.w - 160, y: this.h - 192}, 128, 2, [1.0, 1.0, 1.0, 1.0]);
    }
    
    this.fb_obj.bindFramebuffer(gl.FRAMEBUFFER);
    this.canvas.drawToScreen();

    let fresh_fb : Framebuffer = (this.framebuffer_phase === 0 ? this.fb_after_b : this.fb_after_a);

    if (this.aftrimage.isCompiled()) {
      if (this.framebuffer_phase === 0) {
        this.aftrimage.textureAfter = this.fb_after_a.getColorTexture();
        this.fb_after_b.bindFramebuffer(gl.FRAMEBUFFER);
      } else {
        this.aftrimage.textureAfter = this.fb_after_b.getColorTexture();
        this.fb_after_a.bindFramebuffer(gl.FRAMEBUFFER);
      }

      this.aftrimage.textureInit = this.fb_obj.getColorTexture();
      this.aftrimage.drawMaterial(this.gl, this.sexworld);
    }

    this.framebuffer_phase = 1 - this.framebuffer_phase;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (this.aftrovlay.isCompiled()) {
      this.aftrovlay.textureMain = this.fb_obj.getColorTexture();
      this.aftrovlay.textureAfter = fresh_fb.getColorTexture();
      this.aftrovlay.afterOpacity = 0.161;
      this.aftrovlay.drawMaterial(this.gl, this.sexworld);
    }
  }

  private DrawCircle(center: Point2D, radius: number, stroke: number, color: [number, number, number, number]) {
    let rot_step = Math.PI / 8;
    let rot = 0;
    for (let i = 0; i < 16; i++) {
      let startX = Math.cos(rot) * radius + center.x;
      let startY = Math.sin(rot) * radius + center.y;
      rot += rot_step;
      let endX = Math.cos(rot) * radius + center.x;
      let endY = Math.sin(rot) * radius + center.y;
      this.canvas.addLine(startX, startY, endX, endY, stroke, color);
    }
  }

  // no funny world math, just draw the thing.
  private DrawGeometryDirect(center: Point2D, geom: Array<Point2D>, scale: [number, number], rot: number, stroke: number, color?: [number, number, number, number]) {
    let screenGeom : Array<Point2D> = [];
    let c = Math.cos(rot);
    let s = Math.sin(rot);
    for (let pt of geom) {
      let ptTx = {
        x: center.x + scale[0] * pt.x * c - scale[0] * pt.y * s,
        y: center.y + scale[1] * pt.x * s + scale[1] * pt.y * c
      };

      screenGeom.push(ptTx);
    }

    for (let i = 0; i < screenGeom.length; i++) {
      let sx = screenGeom[i];
      let ex = screenGeom[(i + 1) % screenGeom.length];
      this.canvas.addLine(sx.x, sx.y, ex.x, ex.y, stroke, color);
    }
  }

  private drawGrid(center: WorldPosition, step: number, speed: number, color: [number, number, number, number]) {
    let w = this.w, h = this.h;

    let widthStep = step * w / (this.widthScale);
    let posCenter = center.position.x * speed / step;


    let widthOffV = (posCenter % GRIDSTEP) * widthStep;
    let shipCenter = {
      x: w / 2,
      y: h / 2
    };

    let gridLineX = shipCenter.x - widthOffV;
    gridLineX -= widthStep * Math.ceil(gridLineX / widthStep);
    gridLineX += widthStep;

    while (gridLineX < w) {
      this.canvas.addLine(gridLineX, -1, gridLineX, h + 1, 2, color);
      gridLineX += widthStep;
    }

    let widthOffH = ((center.position.y * speed / step) % GRIDSTEP) * widthStep;
    let gridLineY = shipCenter.y - widthOffH;
    gridLineY -= widthStep * Math.ceil(gridLineY / widthStep);

    gridLineY += widthStep;
    while (gridLineY < h) {
      this.canvas.addLine(-1, gridLineY, w + 1, gridLineY, 2, color);
      gridLineY += widthStep;
    }
  }

  toScreenPosition(center: WorldPosition, pos: WorldPosition) : Point2D {
    let widthStep = this.w / this.widthScale;

    let screenCenter = {
      x: this.w / 2,
      y: this.h / 2
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
  private drawGeometry(center: WorldPosition, pos: WorldPosition, geom: Array<Point2D>, rot: number, scale?: number, color?: [number, number, number, number]) {
    if (scale === undefined) {
      scale = 1.0;
    }

    // find pos relative to center based on widthscale
    let widthStep = this.w / this.widthScale;
    let posScreen = this.toScreenPosition(center, pos);

    let geomRot : Array<Point2D> = [];

    let s = Math.sin(rot), c = Math.cos(rot);

    for (let pt of geom) {
      let ptRot : Point2D = {
        x: pt.x,
        y: pt.y
      };

      ptRot.x = scale * pt.x * c - scale * pt.y * s;
      ptRot.y = scale * pt.x * s + scale * pt.y * c;
      // position relative to pos
      ptRot.x = posScreen.x + ptRot.x * widthStep;
      ptRot.y = posScreen.y + ptRot.y * widthStep;
      geomRot.push(ptRot);
    }

    for (let i = 0; i < geomRot.length; i++) {
      let a = geomRot[i];
      let b = geomRot[(i + 1) % geomRot.length];
      this.canvas.addLine(a.x, a.y, b.x, b.y, 2, color);
    }
  }
}