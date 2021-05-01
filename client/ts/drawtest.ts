import { request } from "express";
import { VectorCanvas } from "./gl/VectorCanvas";
import { InputManager, InputMethod } from "./input/InputManager";
import { KeyInputManager } from "./input/KeyInputManager";
import { GameStateManager } from "./instance/GameStateManager";
import { letters } from "./render/letters";
import { Renderer } from "./render/Renderer";

(function() {

  let name: string = "";
  let c: VectorCanvas;

  let inputmethod = InputMethod.KEYBOARD;

  window.addEventListener("load", main);

  function main() {
    c = new VectorCanvas(document.getElementById("game-window") as HTMLCanvasElement);
    c.waitUntilCompiled().then(() => {
      addEventListener("keydown", keyListener);
      addEventListener("resize", nameFunc);
      addEventListener("mousedown", mouseInputSelection);
      requestAnimationFrame(nameFunc);
    })
  }

  function mouseInputSelection(e: MouseEvent) {
    // figure out where we clicked
    let h = window.innerHeight;

    let x = e.x, y = e.y;

    if (x < 120 || x > 206) {
      return;
    }

    if (y >= (h / 2 + 150) && y < (h / 2 + 166)) {
      inputmethod = InputMethod.KEYBOARD;
    } else if (y >= (h / 2 + 180) && y < (h / 2 + 196)) {
      inputmethod = InputMethod.MOUSE;
    }

    requestAnimationFrame(nameFunc);
  }

  function keyListener(e: KeyboardEvent) {
    let key = e.key.toLowerCase();
    if (letters.hasOwnProperty(key) && name.length < 32) {
      name = name + key;
    } else if (key === "backspace") {
      name = name.substr(0, name.length - 1);
    } else if (key === "enter") {
      startGame();
      return;
    }

    requestAnimationFrame(nameFunc);
  }

  function nameFunc() {
    let w = c.getWidth();
    let h = c.getHeight();

    c.clearCanvas();
    c.addLine(120, h / 2, w - 120, h / 2, 3);
    c.addText(120, h / 2 + 8, "enter name", 2, [8, 8]);
    c.addText(120, h / 2 - 40, name, 2, [16, 16]);

    c.addText(120, h / 2 + 100, "input method", 2, [16, 16]);
    c.addText(120, h / 2 + 150, "keyboard", 2, [8, 8], (inputmethod === InputMethod.KEYBOARD ? [1, 1, 1, 1] : [0.5, 0.5, 0.5, 1]));
    // 120, (h / 2 + 150) to 206, (h / 2 + 166)
    c.addText(120, h / 2 + 180, "mouse", 2, [8, 8], (inputmethod === InputMethod.MOUSE ? [1, 1, 1, 1] : [0.5, 0.5, 0.5, 1]));
    // 120, (h / 2 + 180) to 168, (h / 2 + 196)

    c.drawToScreen();
  }

  function startGame() {
    if (name === "") {
      name = "dickmuncher";
    }

    removeEventListener("mousedown", mouseInputSelection);
    removeEventListener("keydown", keyListener);
    removeEventListener("resize", nameFunc);
    let c = new VectorCanvas(document.getElementById("game-window") as HTMLCanvasElement);
    let w = new GameStateManager(name, inputmethod);
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

    setInterval(() => {
      fetch(window.location.protocol + "//" + window.location.host + "/heroku")
        .then(() => console.log("pinged host :)"));
    }, 15000);
  }

  function f(c: VectorCanvas, w: GameStateManager, g: Renderer) {
    w.update();
    c.clearCanvas();
    g.drawInstances(w.getShip(), w.getInstances());
    requestAnimationFrame(() => { f(c, w, g) });
  }

})();