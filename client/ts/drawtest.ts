import { VectorCanvas } from "./gl/VectorCanvas";
import { GameStateManager } from "./instance/GameStateManager";
import { Renderer } from "./render/Renderer";

(function() {

  window.addEventListener("load", main);

  function main() {
    let c = new VectorCanvas(document.getElementById("game-window") as HTMLCanvasElement);
    let w = new GameStateManager("dickmuncher");
    let g = new Renderer(16, c);
    c.waitUntilCompiled()
      .then(async () => { await w.waitUntilConnected(); })
      .then(() => {
        requestAnimationFrame(() => { f(c, w, g) })
      });

    // create this only after name is confirmed
    // use some new component to monitor w
    // update w once per frame, and draw
    // then wait for next frame
  }

  function f(c: VectorCanvas, w: GameStateManager, g: Renderer) {
    w.update();
    c.clearCanvas();
    c.addLine(120, 120, 300, 300, 25);
    c.addLine(5.5, 5.5, 125.5, 5.5, 2);
    c.addLine(15, 15, 15, 125, 3);
    g.drawInstances(w.getShip(), w.getInstances());
    requestAnimationFrame(() => { f(c, w, g) });
  }


})();