import { randomBytes } from "crypto";

async function generateID(bytes: number) : Promise<string> {
  let p = new Promise<string>((res, rej) => {
    randomBytes(bytes, (err, buf) => {
      if (err) {
        rej(err);
      }

      res(buf.toString("hex"));
    });
  });

  return p;
}

export { generateID };