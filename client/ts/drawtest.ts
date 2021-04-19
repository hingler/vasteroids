import { VectorCanvas } from "./gl/VectorCanvas";
import { ClientSocketManager } from "./instance/ClientSocketManager";

(function() {

  window.addEventListener("load", main);

  function main() {
    let c = new VectorCanvas(document.getElementById("the-monkey") as HTMLCanvasElement);
    c.waitUntilCompiled().then(() => {
      c.addLine(120, 120, 300, 300, 25);
      c.addLine(5.5, 5.5, 125.5, 5.5, 2);
      c.addLine(15, 15, 15, 125, 3);
      c.drawToScreen();
    });

    let w = new ClientSocketManager();
  }


})();