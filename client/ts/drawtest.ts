import { VectorCanvas } from "./gl/VectorCanvas";
import { GameStateManager } from "./instance/GameStateManager";

(function() {

  window.addEventListener("load", main);

  function main() {
    let c = new VectorCanvas(document.getElementById("game-window") as HTMLCanvasElement);
    c.waitUntilCompiled().then(() => {
      requestAnimationFrame(() => { f(c) });
      

    });

    // create this only after name is confirmed
    let w = new GameStateManager("dickmuncher");
  }

  function f(c: VectorCanvas) {
    c.clearCanvas();
    c.addLine(120, 120, 300, 300, 25);
    c.addLine(5.5, 5.5, 125.5, 5.5, 2);
    c.addLine(15, 15, 15, 125, 3);
    c.drawToScreen();
    requestAnimationFrame(() => { f(c) });
  }


})();