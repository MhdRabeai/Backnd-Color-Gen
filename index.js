const express = require("express");
const app = express();
const port = 4000;
const path = require("path");
const cors = require("cors");
const fs = require("fs/promises");
const fss = require("fs");
const CryptoJS = require("crypto-js");
const chroma = require("chroma-js");
const multer = require("multer");
let randomFive = genFiveRandom();
const PDFDocument = require("pdfkit");
var type = "";
app.use("/", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(
  cors({
    origin: "https://colorgenerator-tawny.vercel.app",
    credentials: true,
  })
);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "css");
  },
  filename: (req, file, cb) => {
    cb(null, "temp-colors.css");
  },
});
const upload = multer({ storage: storage });
app.get("/", (req, res) => {
  return res.json({ randomFive, type });
});
app.post("/", (req, res) => {
  const { method } = req.body;
  if (method) {
    const baseHue = Math.floor(Math.random() * 360);
    if (method === "random") {
      type = "random";
      randomFive = genFiveRandom();
      return res.json({ randomFive, type });
    }
    if (method === "monochrome") {
      type = "monochrome";
      const data = generateMonochromeColors(baseHue);
      randomFive = Array.from({ length: 5 }, (_, id) => ({
        id,
        color: data[id],
        type: "hsl",
      }));

      return res.json({ randomFive, type });
    }
    if (method === "additional") {
      type = "additional";
      const data = generateAdditionalColors(baseHue);
      randomFive = Array.from({ length: 3 }, (_, id) => ({
        id,
        color: data[id],
        type: "hsl",
      }));
      return res.json({ randomFive, type });
    }
    if (method === "triadic") {
      type = "triadic";
      const data = generateTriadicColors(baseHue);
      randomFive = Array.from({ length: 3 }, (_, id) => ({
        id,
        color: data[id],
        type: "hsl",
      }));
      return res.json({ randomFive, type });
    }
    if (method === "quadratic") {
      type = "quadratic";
      const data = generateQuadraticColors(baseHue);
      randomFive = Array.from({ length: 4 }, (_, id) => ({
        id,
        color: data[id],
        type: "hsl",
      }));
      return res.json({ randomFive, type });
    }
  } else {
    return res.status(404);
  }
  return res.json(randomFive);
});

app.get("/item/:id?", (req, res) => {
  const id = +req.params.id;
  const myEle = randomFive.find((e) => e.id === id);
  const query = req.query;
  if (myEle) {
    if (Object.values(query)[0] === "state") {
      myEle.state = !myEle.state;
      console.log(myEle);
    }
    if (Object.values(query)[0] === "newColor") {
      myEle.like = !myEle.like;
    }
    return res.status(200).json({ message: "Toggled successfully" });
  } else {
    return res.status(404).json({ message: "Not found" });
  }
});

app.post("/item/:id?", async (req, res) => {
  const id = +req.params.id;
  const { to } = req.body;

  const myEle = randomFive.find((e) => e.id === id);
  if (myEle) {
    console.log("myEle", myEle);
    if (myEle.type === "hex" && to === "rgb") {
      myEle.color = hexToRgb(myEle.color);
      myEle.type = "rgb";
      return res.json(randomFive);
    }
    if (myEle.type === "hex" && to === "hsl") {
      myEle.color = hexToHsl(myEle.color);
      myEle.type = "hsl";
      // console.log(randomFive);
      return res.json(randomFive);
    }
    if (myEle.type === "hex" && to === "rgb") {
      console.log(hexToRgb(myEle.color));
      myEle.color = hexToRgb(myEle.color);
      myEle.type = "rgb";
      // console.log(randomFive);
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
      // console.log("lllll");
      return;
    }

    return;
  } else {
    return res.status(404).json({ message: "Not found" });
  }
});

app.get("/regenerate?", (req, res) => {
  if (req.query["tab"]) {
    const baseHue = Math.floor(Math.random() * 360);
    if (req.query["tab"] === "random") {
      const data = reGenerate();
      return res.json({ randomFive: data });
    } else if (req.query["tab"] === "monochrome") {
      const data = generateMonochromeColors(baseHue);
      randomFive = Array.from({ length: 5 }, (_, id) => ({
        id,
        color: data[id],
        state: false,
        type: "hsl",
      }));

      return res.json({ randomFive });
    } else if (req.query["tab"] === "additional") {
      const data = generateAdditionalColors(baseHue);
      randomFive = Array.from({ length: 3 }, (_, id) => ({
        id,
        color: data[id],
        state: false,
        type: "hsl",
      }));

      return res.json({ randomFive });
    } else if (req.query["tab"] === "triadic") {
      const data = generateTriadicColors(baseHue);
      randomFive = Array.from({ length: 3 }, (_, id) => ({
        id,
        color: data[id],
        state: false,
        type: "hsl",
      }));

      return res.json({ randomFive });
    } else if (req.query["tab"] === "quadratic") {
      const data = generateQuadraticColors(baseHue);
      randomFive = Array.from({ length: 4 }, (_, id) => ({
        id,
        color: data[id],
        state: false,
        type: "hsl",
      }));
      return res.json({ randomFive });
    }
  } else {
    return res.status(404);
  }
});
app.get("/palettes", async (req, res) => {
  try {
    const data = await fs.readFile("./db/paletts.json", { encoding: "utf8" });
    return res.send(data);
  } catch (err) {
    return res.status(404);
  }
});
app.post("/palettes", async (req, res) => {
  const uuid = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
  const shortUuid = uuid.slice(0, 8);
  const { paletteName, palette } = req.body;
  try {
    const data = JSON.parse(
      await fs.readFile("./db/paletts.json", { encoding: "utf8" })
    );
    const myObj = {
      code: shortUuid,
      paletteName,
      palette,
      like: false,
    };
    data.push(myObj);
    await fs.writeFile("./db/paletts.json", JSON.stringify(data, null, "\t"));
    return res.status(200).json({ code: shortUuid });
  } catch (err) {
    return res.status(404);
  }
});
app.get("/palettes/:code?", async (req, res) => {
  const { code } = req.params;
  const { element } = req.query;
  if (element && element === "like") {
    try {
      const data = JSON.parse(
        await fs.readFile("./db/paletts.json", { encoding: "utf8" })
      );
      const myEle = data.find((e) => e.code === code);
      if (myEle) {
        myEle["like"] = !myEle["like"];
        await fs.writeFile(
          "./db/paletts.json",
          JSON.stringify(data, null, "\t")
        );
        return res.status(200).json({ palette: myEle });
      } else {
        throw new Error("Element Not Found!!!");
      }
    } catch (err) {
      return res.status(404);
    }
  }
  if (!element) {
    const data = JSON.parse(
      await fs.readFile("./db/paletts.json", { encoding: "utf8" })
    );
    const myEle = data.find((e) => e.code === code);
  } else {
    return res.status(404);
  }
});
app.post("/palettes/:code", async (req, res) => {
  const { code } = req.params;
  const { to } = req.body;

  try {
    const data = JSON.parse(
      await fs.readFile("./db/paletts.json", { encoding: "utf8" })
    );
    const myEle = data.find((e) => e.code === code);
    const index = data.findIndex((e) => e.code === code);
    if (myEle) {
      console.log("type", myEle["palette"][0]["type"]);
      if (myEle["palette"][0]["type"] === "hex" && to === "rgb") {
        myEle["palette"].forEach((element) => {
          element.color = hexToRgb(element.color);
          element.type = "rgb";
          return element;
        });
        var myObj = {
          code: myEle.code,
          paletteName: myEle.paletteName,
          palette: myEle.palette,
          like: myEle.like,
        };
        data.splice(index, 1, myObj);
        await fs.writeFile(
          "./db/paletts.json",
          JSON.stringify(data, null, "\t")
        );
        return res.status(200).json({ palette: myObj });
      } else if (myEle["palette"][0]["type"] === "hex" && to === "hsl") {
        myEle["palette"].forEach((element) => {
          element.color = hexToHsl(element.color);
          element.type = "hsl";
          return element;
        });
        var myObj = {
          code: myEle.code,
          paletteName: myEle.paletteName,
          palette: myEle.palette,
          like: myEle.like,
        };
        data.splice(index, 1, myObj);
        await fs.writeFile(
          "./db/paletts.json",
          JSON.stringify(data, null, "\t")
        );
        return res.status(200).json({ palette: myObj });
      } else if (myEle["palette"][0]["type"] === "hex" && to === "rgb") {
        myEle["palette"].forEach((element) => {
          element.color = hexToRgb(element.color);
          element.type = "rgb";
          return element;
        });
        var myObj = {
          code: myEle.code,
          paletteName: myEle.paletteName,
          palette: myEle.palette,
          like: myEle.like,
        };
        data.splice(index, 1, myObj);
        await fs.writeFile(
          "./db/paletts.json",
          JSON.stringify(data, null, "\t")
        );
        return res.status(200).json({ palette: myObj });
      } else if (myEle["palette"][0]["type"] === "rgb" && to === "hex") {
        myEle["palette"].forEach((element) => {
          element.color = rgbToHex(element.color);
          element.type = "hex";
          return element;
        });
        var myObj = {
          code: myEle.code,
          paletteName: myEle.paletteName,
          palette: myEle.palette,
          like: myEle.like,
        };
        data.splice(index, 1, myObj);
        await fs.writeFile(
          "./db/paletts.json",
          JSON.stringify(data, null, "\t")
        );
        return res.status(200).json({ palette: myObj });
      } else if (myEle["palette"][0]["type"] === "rgb" && to === "hsl") {
        myEle["palette"].forEach((element) => {
          const result = rgbToHex(element.color);
          element.color = hexToHsl(result);
          element.type = "hsl";
          return element;
        });
        var myObj = {
          code: myEle.code,
          paletteName: myEle.paletteName,
          palette: myEle.palette,
          like: myEle.like,
        };
        data.splice(index, 1, myObj);
        await fs.writeFile(
          "./db/paletts.json",
          JSON.stringify(data, null, "\t")
        );
        return res.status(200).json({ palette: myObj });
      } else if (myEle["palette"][0]["type"] === "hsl" && to === "hex") {
        myEle["palette"].map((element) => {
          element.color = hslToHex(element.color);
          element.type = "hex";
          return element;
        });
        var myObj = {
          code: myEle.code,
          paletteName: myEle.paletteName,
          palette: myEle.palette,
          like: myEle.like,
        };
        data.splice(index, 1, myObj);
        await fs.writeFile(
          "./db/paletts.json",
          JSON.stringify(data, null, "\t")
        );
        return res.status(200).json({ palette: myObj });
      } else if (myEle["palette"][0]["type"] === "hsl" && to === "rgb") {
        myEle["palette"].forEach((element) => {
          const result = extractNumbers(element.color);
          element.color = hslToRgb(result[0], result[1], result[2]);
          element.type = "rgb";
          return element;
        });
        var myObj = {
          code: myEle.code,
          paletteName: myEle.paletteName,
          palette: myEle.palette,
          like: myEle.like,
        };
        data.splice(index, 1, myObj);
        await fs.writeFile(
          "./db/paletts.json",
          JSON.stringify(data, null, "\t")
        );
        return res.status(200).json({ palette: myObj });
      } else if (myEle["palette"][0]["type"] === to) {
        return myEle;
      }

      console.log("myObj", myObj);
      return res.status(200).json({ palette: myObj });
    } else {
      throw new Error("Element Not Found!!!");
    }
  } catch (err) {
    return res.status(404);
  }
});
app.get("/palette/item/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const data = JSON.parse(
      await fs.readFile("./db/paletts.json", { encoding: "utf8" })
    );
    const myEle = data.find((e) => e.code === code);
    // const index = data.findIndex((e) => e.code === code);
    if (myEle) {
      return res.status(200).json({ data: myEle });
    }
  } catch (err) {
    return res.status(404);
  }
});
app.post("/cssFile", upload.single("file"), async (req, res) => {
  try {
    // console.log("send", req.body);
    const shades = generateShades(req.body);
    let cssContent = ":root {\n";
    Object.keys(shades).forEach((colorKey, colorIndex) => {
      shades[colorKey].forEach((shade, shadeIndex) => {
        cssContent += `  --${colorKey}-shade-${shadeIndex + 1}: ${shade};\n`;
      });
    });
    cssContent += "}\n";
    const uuid = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const shortUuid = uuid.slice(0, 8);
    const fileName = `colors-${shortUuid}.css`;
    const filePath = path.join(__dirname, "public", "css", fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, cssContent, "utf8");
    const fileUrl = `http://localhost:4000/css/${fileName}`;
    return res.status(200).json({ url: fileUrl, name: fileName });
  } catch (err) {
    return res.status(404);
  }
});
app.post("/pdfFile", async (req, res) => {
  try {
    console.log("send", req.body);

    // توليد الظلال بناءً على الألوان المرسلة
    const shades = generateShades(req.body);
    if (!shades || Object.keys(shades).length === 0) {
      return res.status(400).send("No shades data available");
    }
    // إنشاء اسم الملف باستخدام UUID عشوائي
    const uuid = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const shortUuid = uuid.slice(0, 8);
    const fileName = `colors-${shortUuid}.pdf`;
    const filePath = path.join(__dirname, "public", "pdf", fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const doc = new PDFDocument({ size: "A4" });
    const writeStream = fss.createWriteStream(filePath);
    doc.pipe(writeStream);
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#2C3E50")
      .text("Color Palette with Shades", {
        align: "center",
        underline: true,
      });
    doc.moveDown(1);
    let yPosition = doc.y + 20;
    let pageNumber = 1;
    Object.keys(shades).forEach((colorKey, colorIndex) => {
      const color = shades[colorKey];
      doc
        .font("Helvetica")
        .fontSize(14)
        .fillColor("#34495E")
        .text(`${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}:`, {
          continued: true,
        });

      yPosition += 15;

      color.forEach((shade, index) => {
        if (yPosition + 25 > doc.page.height - 50) {
          doc.addPage();
          pageNumber += 1;
          yPosition = 50;
        }

        doc.rect(50, yPosition, 100, 20).fill(shade);
        doc
          .font("Helvetica")
          .fontSize(12)
          .fillColor("#7F8C8D")
          .text(`Shade ${index + 1}: ${shade}`, 160, yPosition + 5);
        yPosition += 25;
      });

      yPosition += 10;
    });

    doc.end();

    writeStream.on("finish", () => {
      const fileUrl = `http://localhost:4000/pdf/${fileName}`;
      res.json({ url: fileUrl });
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error generating PDF file");
  }
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
// ***********************

function generateQuadraticColors(baseHue) {
  return [
    `hsl(${baseHue}, 50%, 50%)`,
    `hsl(${(baseHue + 90) % 360}, 50%, 50%)`,
    `hsl(${(baseHue + 180) % 360}, 50%, 50%)`,
    `hsl(${(baseHue + 270) % 360}, 50%, 50%)`,
  ];
}

function generateTriadicColors(baseHue) {
  return [
    `hsl(${baseHue}, 50%, 50%)`,
    `hsl(${(baseHue + 120) % 360}, 50%, 50%)`,
    `hsl(${(baseHue + 240) % 360}, 50%, 50%)`,
  ];
}
function generateAdditionalColors(baseHue) {
  return [
    `hsl(${baseHue}, 50%, 50%)`, //
    `hsl(${(baseHue + 30) % 360}, 50%, 50%)`,
    `hsl(${(baseHue - 30 + 360) % 360}, 50%, 50%)`,
  ];
}
function generateMonochromeColors(baseHue) {
  let colors = [];
  for (let i = 0; i < 5; i++) {
    let lightness = 20 + i * 10;
    colors.push(`hsl(${baseHue}, 50%, ${lightness}%)`);
  }
  return colors;
}
function generateShades(colors) {
  let shades = {};
  colors.forEach((color, colorIndex) => {
    const colorShades = chroma
      .scale([
        chroma(color["color"]).brighten(2),
        chroma(color["color"]).darken(2),
      ])
      .mode("lab")
      .colors(8);
    shades[`color${colorIndex + 1}`] = colorShades;
  });
  return shades;
}
