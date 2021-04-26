import { VectorCanvas } from "./gl/VectorCanvas";
import { GameStateManager } from "./instance/GameStateManager";
import { Renderer } from "./render/Renderer";

(function() {

  window.addEventListener("load", main);

  function main() {
    let c = new VectorCanvas(document.getElementById("game-window") as HTMLCanvasElement);
    let w = new GameStateManager("dickmuncher");
    c.waitUntilCompiled()
      .then(async () => { await w.waitUntilConnected(); })
      .then(() => {
        let g = new Renderer(12, c, w.getDims());
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
    g.drawInstances(w.getShip(), w.getInstances());
    requestAnimationFrame(() => { f(c, w, g) });
  }

})();