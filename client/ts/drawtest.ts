import { VectorCanvas } from "./gl/VectorCanvas";
import { GameStateManager } from "./instance/GameStateManager";

(function() {

  window.addEventListener("load", main);

  function main() {
    let c = new VectorCanvas(document.getElementById("game-window") as HTMLCanvasElement);
    let w = new GameStateManager("dickmuncher");
    c.waitUntilCompiled().then(() => {
      requestAnimationFrame(() => { f(c, w) });
      

    });

    // create this only after name is confirmed
    // use some new component to monitor w
    // update w once per frame, and draw
    // then wait for next frame
  }

  function f(c: VectorCanvas, w: GameStateManager) {
    w.update();
    c.clearCanvas();
    c.addLine(120, 120, 300, 300, 25);
    c.addLine(5.5, 5.5, 125.5, 5.5, 2);
    c.addLine(15, 15, 15, 125, 3);
    c.drawToScreen();
    requestAnimationFrame(() => { f(c, w) });
  }


})();