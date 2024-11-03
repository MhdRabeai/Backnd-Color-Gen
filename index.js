const express = require("express");
const app = express();
const port = 4000;
const path = require("path");
const cors = require("cors");

let randomFive = genFiveRandom();

app.use("/static", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  return res.json(randomFive);
});

app.get("/item/:id?", (req, res) => {
  const id = +req.params.id;
  const myEle = randomFive.find((e) => e.id === id);
  const query = req.query;
  if (myEle) {
    if (Object.values(query)[0] === "state") {
      myEle.state = !myEle.state;
    }
    if (Object.values(query)[0] === "like") {
      myEle.like = !myEle.like;
    }
    return res.status(200).json({ message: "Toggled successfully" });
  } else {
    return res.status(404).json({ message: "Not found" });
  }
});
// app.get("/item/:id", (req, res) => {
//   const id = +req.params.id;
//   const myEle = randomFive.find((e) => e.id === id);
//   if (myEle) {
//     myEle.state = !myEle.state;
//     return res.status(200).json({ message: "Toggled successfully" });
//   } else {
//     return res.status(404).json({ message: "Not found" });
//   }
// });

app.post("/item/:id", async (req, res) => {
  const id = +req.params.id;
  const { to } = req.body;
  const myEle = randomFive.find((e) => e.id === id);
  if (myEle) {
    if (myEle.type === "hex" && to === "rgb") {
      myEle.color = hexToRgb(myEle.color);
      myEle.type = "rgb";
      return res.json(randomFive);
    }
    if (myEle.type === "hex" && to === "hsl") {
      myEle.color = hexToHsl(myEle.color);
      myEle.type = "hsl";
      console.log(randomFive);
      return res.json(randomFive);
    }
    if (myEle.type === "hex" && to === "rgb") {
      console.log(hexToRgb(myEle.color));
      myEle.color = hexToRgb(myEle.color);
      myEle.type = "rgb";
      console.log(randomFive);
      return res.json(randomFive);
    }
    if (myEle.type === "rgb" && to === "hex") {
      myEle.color = rgbToHex(myEle.color);
      myEle.type = "hex";
      return res.json(randomFive);
    }
    if (myEle.type === "rgb" && to === "hsl") {
      const result = rgbToHex(myEle.color);
      myEle.color = hexToHsl(result);
      myEle.type = "hsl";
      return res.json(randomFive);
    }
    if (myEle.type === "hsl" && to === "hex") {
      myEle.color = hslToHex(myEle.color);
      myEle.type = "hex";
      console.log(randomFive);
      return res.json(randomFive);
    }
    if (myEle.type === "hsl" && to === "rgb") {
      const result = extractNumbers(myEle.color);
      myEle.color = hslToRgb(result[0], result[1], result[2]);
      myEle.type = "rgb";
      return res.json(randomFive);
    }
    if (myEle.type === to) {
      console.log("lllll");
      return;
    }
    return;
  } else {
    return res.status(404).json({ message: "Not found" });
  }
});

app.get("/regenerate", (req, res) => {
  randomFive = reGenerate();
  setTimeout(() => {}, 2000);
  return res.json(randomFive);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

function randColor() {
  let n = (Math.random() * 0xfffff * 1000000).toString(16);
  return "#" + n.slice(0, 6);
}

function genFiveRandom() {
  return Array.from({ length: 5 }, (_, id) => ({
    id,
    color: randColor(),
    state: false,
    type: "hex",
    like: false,
  }));
}

function reGenerate() {
  return randomFive.map((ele) =>
    ele.state ? ele : { ...ele, color: randColor() }
  );
}

function hexToHsl(hex) {
  hex = hex.replace(/^#/, "");
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  h = Math.round(h);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  return `rgb(${r}, ${g}, ${b})`;
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `rgb(${r},${g},${b})`;
}

function rgbToHex(str) {
  console.log(str);
  const arr = extractNumbers(str);
  const toHex = (value) => {
    let hex = value?.toString(16);
    return hex?.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(arr[0])}${toHex(arr[1])}${toHex(arr[2])}`;
}

function hslToHex(input) {
  const arr = extractNumbers(input);
  const rgb = hslToRgb(arr[0], arr[1], arr[2]);
  return rgbToHex(rgb);
}

function extractNumbers(input) {
  const str = typeof input === "string" ? input : String(input);
  const match = str.replace(/%/g, "").match(/\d+/g);
  return match ? match.map(Number) : [];
}

// function generateMonochromeColors(baseHue, numShades) {
//   let colors = [];
//   for (let i = 0; i < numShades; i++) {
//     let lightness = 20 + i * 10; // قم بتعديل القيم حسب الحاجة
//     colors.push(`hsl(${baseHue}, 50%, ${lightness}%)`);
//   }
//   return colors;
// }

// console.log(generateMonochromeColors(200, 5)); // درجات الأزرق

// function generateAdditionalColors(baseHue) {
//   return [
//     `hsl(${baseHue}, 50%, 50%)`, // اللون الأساسي
//     `hsl(${(baseHue + 30) % 360}, 50%, 50%)`, // لون إضافي 1
//     `hsl(${(baseHue - 30 + 360) % 360}, 50%, 50%)` // لون إضافي 2
//   ];
// }

// console.log(generateAdditionalColors(200)); // ألوان إضافية للأزرق

// function generateTriadicColors(baseHue) {
//   return [
//     `hsl(${baseHue}, 50%, 50%)`, // اللون الأساسي
//     `hsl(${(baseHue + 120) % 360}, 50%, 50%)`, // لون ثلاثي 1
//     `hsl(${(baseHue + 240) % 360}, 50%, 50%)` // لون ثلاثي 2
//   ];
// }

// console.log(generateTriadicColors(200)); // ألوان ثلاثية للأزرق

// function generateQuadraticColors(baseHue) {
//   return [
//     `hsl(${baseHue}, 50%, 50%)`, // اللون الأساسي
//     `hsl(${(baseHue + 90) % 360}, 50%, 50%)`, // لون رباعي 1
//     `hsl(${(baseHue + 180) % 360}, 50%, 50%)`, // لون رباعي 2
//     `hsl(${(baseHue + 270) % 360}, 50%, 50%)` // لون رباعي 3
//   ];
// }

// console.log(generateQuadraticColors(200)); // ألوان رباعية للأزرق

// function generateRandomColor() {
//   let hue = Math.floor(Math.random() * 360);
//   let saturation = Math.floor(Math.random() * 100);
//   let lightness = Math.floor(Math.random() * 100);
//   return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
// }

// console.log(generateRandomColor()); // لون عشوائي
