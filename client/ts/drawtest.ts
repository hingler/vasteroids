import { request } from "express";
import { Point2D } from "../../instances/GameTypes";
import { BiomePacket } from "../../packet/BiomePacket";
import { VectorCanvas } from "./gl/VectorCanvas";
import { InputManager, InputMethod } from "./input/InputManager";
import { KeyInputManager } from "./input/KeyInputManager";
import { TouchInputManager } from "./input/TouchInputManager";
import { GameStateManager } from "./instance/GameStateManager";
import { letters } from "./render/letters";
import { Renderer } from "./render/Renderer";

(function() {

  let name: string = "";
  let c: VectorCanvas;
  let map: Map<number, Point2D>;
  let touchinput: boolean = false;

  let inputmethod = InputMethod.KEYBOARD;

  window.addEventListener("load", main);

  function main() {
    map = new Map();
    c = new VectorCanvas(document.getElementById("game-window") as HTMLCanvasElement);
    c.waitUntilCompiled().then(() => {
      addEventListener("keydown", keyListener);
      addEventListener("resize", nameFunc);
      addEventListener("mousedown", mouseInputSelection);
      addEventListener("touchstart", touchInputSelection);
      addEventListener("touchend", touchReleaseSelection);
      requestAnimationFrame(nameFunc);
    })
  }

  function handleInput(x: number, y: number) {
    let h = document.body.clientHeight;
    let w = document.body.clientWidth;
    console.log("window height: " + window.innerHeight);
    console.log("body height: " + h);

    if (y >= (h / 2 + 172) && y < (h / 2 + 204)) {
      inputmethod = InputMethod.KEYBOARD;
    } else if (y >= (h / 2 + 212) && y < (h / 2 + 244)) {
      inputmethod = InputMethod.MOUSE;
    } else if (y >= (h / 2 + 252) && y < (h / 2 + 282)) {
      inputmethod = InputMethod.TOUCH;
    }

    if (touchinput) {
      if (x > 120 && x < (w - 120) && y > 32 && y < 108) {
        startGame();
      }
    }
  }

  function touchInputSelection(e: TouchEvent) {
    for (let touch of e.touches) {
      map.set(touch.identifier, {
        x: touch.pageX,
        y: touch.pageY
      } as Point2D);
    }

    requestAnimationFrame(nameFunc);
  }

  function touchReleaseSelection(e: TouchEvent) {
    // remove from map
    // if we're in range: handle the event
    for (let touch of e.changedTouches) {
      let pt : Point2D = map.get(touch.identifier);
      if (pt) {
        let dist : Point2D = {
          x: pt.x - touch.pageX,
          y: pt.y - touch.pageY
        };

        let x = touch.pageX, y = touch.pageY;
        let mag = dist.x * dist.x + dist.y * dist.y;
        if (mag < 729) { // 27px -- reasonable fudge for a tap
          // special case: click on dialogue box on mobile
          let x = touch.pageX, y = touch.pageY;
          let h = document.body.clientHeight;
          if (x > 120 && x < (document.body.clientWidth - 120) && y > (h / 2 - 80) && y < (h / 2 + 32)) {
            let input = prompt("Enter ship name", name);
            if (input) {
              input = input.toLowerCase();
              let acc = "";
              for (let char of input) {
                if (letters.hasOwnProperty(char)) {
                  acc += char;
                }

                name = acc;
              }
              
              touchinput = true;
              inputmethod = InputMethod.TOUCH;
            }
            // don't prompt multiple times.
            break;
          } else {
            handleInput(touch.pageX, touch.pageY);
          }
        }
      }

      map.delete(touch.identifier);
    }

    requestAnimationFrame(nameFunc);
  }

  function mouseInputSelection(e: MouseEvent) {
    let x = e.x, y = e.y;
    handleInput(x, y);
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
    c.addText(120, h / 2 + 8, "enter name", 2, [12, 12]);
    c.addText(120, h / 2 - 80, name, 2, [32, 32]);

    c.addText(120, h / 2 + 100, "input method", 2, [24, 24]);
    c.addText(120, h / 2 + 172, "keyboard", 2, [16, 16], (inputmethod === InputMethod.KEYBOARD ? [1, 1, 1, 1] : [0.5, 0.5, 0.5, 1]));
    // 120, (h / 2 + 150) to 206, (h / 2 + 166)
    c.addText(120, h / 2 + 212, "mouse", 2, [16, 16], (inputmethod === InputMethod.MOUSE ? [1, 1, 1, 1] : [0.5, 0.5, 0.5, 1]));
    // 120, (h / 2 + 180) to 168, (h / 2 + 196)
    c.addText(120, h / 2 + 252, "touch", 2, [16, 16], (inputmethod === InputMethod.TOUCH ? [1, 1, 1, 1] : [0.5, 0.5, 0.5, 1]))

    if (touchinput) {
      c.addLine(120, 32, (w - 120), 32, 2);
      c.addLine(120, 108, (w - 120), 108, 2);
      c.addLine(120, 32, 120, 108, 2);
      c.addLine((w - 120), 32, (w - 120), 108, 2);
      c.addText((w / 2 - 136), 38, "CONFIRM", 2, [32, 32]);
    }
    c.drawToScreen();
  }

  function startGame() {
    if (name === "") {
      name = "dickmuncher";
    }

    removeEventListener("mousedown", mouseInputSelection);
    removeEventListener("keydown", keyListener);
    removeEventListener("resize", nameFunc);
    removeEventListener("touchstart", touchInputSelection);
    removeEventListener("touchend", touchReleaseSelection);
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
    g.drawInstances(w, (inputmethod === InputMethod.TOUCH ? w.ship.inputmgr as TouchInputManager : undefined));
    requestAnimationFrame(() => { f(c, w, g) });
  }

})();