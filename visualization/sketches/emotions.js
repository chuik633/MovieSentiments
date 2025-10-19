const width = window.innerWidth;
const height = window.innerHeight - 100;
const movie = "Call Me by Your Name";
let emotionData;

let currIdx = 0;
let currSeconds;
let startTime = 0;
const speed = 10;
// Replace this with correlated colors
const emotionColors = {
  joy: "#EECE26",
  sadness: "#62727E",
  anger: "#E43F36",
  fear: "#A7A328",
  anticipation: "#dd6d34ff",
};
const emotionList = [
  "joy",
  "sadness",
  "trust",
  "disgust",
  "anger",
  "fear",
  "anticipation",
  "surprise",
];

let particles = [];
const emotionEndPos = {
  joy: { x: width / 2, y: 0 },
  anticipation: { x: width, y: 0 },
  surprise: { x: width, y: height / 2 },
  fear: { x: width, y: height },
  sadness: { x: width / 2, y: height },
  anger: { x: 0, y: height },
  trust: { x: 0, y: 0 },
  disgust: { x: 0, y: height / 2 },
};

const spacing = 10;
const endSpacing = 20;
class EmotionParticle {
  constructor(emotion, speed, color, size, symbol) {
    // this.emotion = emotion;
    this.emotion = emotion;
    this.noiseZoom = 0.1;
    this.noiseSpeed = 0.01;
    this.noiseMag = 0.2;
    this.color = color;
    this.size = size;
    if (!symbol) {
      this.symbol = "circle";
    } else {
      this.symbol = symbol;
    }
    // this.symbol = "circle";

    // this.color = emotionColors[emotion];
    this.origPos = {
      x: width / 2,
      y: height / 2,
    };
    this.endPos = {
      x: emotionEndPos[emotion].x,
      y: emotionEndPos[emotion].y,
    };
    this.endPos.x += random() * endSpacing;
    this.endPos.y += random() * endSpacing;
    this.pos = {
      x: width / 2 + spacing * random(),
      y: height / 2 + spacing * random(),
    };
    this.speed = speed;
    this.dir = this.getDirection(this.pos, this.endPos);
  }
  run() {
    this.move();
    this.checkEdges();
    this.update();
  }
  move() {
    const dx = this.endPos.x - this.pos.x;
    const dy = this.endPos.y - this.pos.y;
    const angle = Math.atan2(dy, dx);
    const n = noise(
      this.pos.x * this.noiseZoom,
      this.pos.y * this.noiseZoom,
      frameCount * this.noiseSpeed
    );
    const angleNoise = n * TWO_PI * this.noiseMag;

    this.dir.x = cos(angle + angleNoise);
    this.dir.y = sin(angle + angleNoise);

    this.pos.x += this.dir.x * this.speed;
    this.pos.y += this.dir.y * this.speed;
  }
  checkEdges() {
    const d = dist(this.pos.x, this.pos.y, this.endPos.x, this.endPos.y);
    if (d < endSpacing) {
      const temp = this.endPos;
      this.endPos = this.origPos;
      this.origPos = temp;
      this.pos = { x: this.origPos.x, y: this.origPos.y };
    }

    if (
      this.pos.x < 0 ||
      this.pos.x > width ||
      this.pos.y < 0 ||
      this.pos.y > height
    ) {
      this.pos = { x: this.origPos.x, y: this.origPos.y };
    }
  }

  update() {
    fill(this.color);
    noStroke();
    if (this.symbol == "circle") {
      rect(this.pos.x, this.pos.y, this.size, this.size);
    } else {
      textSize(this.size);
      text(this.symbol, this.pos.x, this.pos.y);
    }
  }

  getDirection(from, to) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    return { x: cos(angle), y: sin(angle) };
  }
}

function getSeconds() {
  return 60 + Math.floor((millis() / 1000) * speed);
}
function loadData() {
  d3.csv("../../data/spiritedaway/emotion_color_data.csv", d3.autoType).then(
    (data) => {
      emotionData = data.map((d) => {
        if (d.colors) {
          d.colors = d.colors
            .replace(/[\[\]]/g, "")
            .trim()
            .split(/\n|\s{2,}/)
            .filter((row) => row.trim().length)
            .map((row) =>
              row
                .trim()
                .split(/\s+/)
                .map((n) => Math.round(Number(n) * 255))
            );
        }
        return d;
      });

      console.log("emotiondata:", emotionData);
    }
  );
}

loadData();

async function setup() {
  createCanvas(width, height);
  startTime = getSeconds();
  createButton("start").mousePressed(() => {
    startTime = getSeconds();
  });
  angleMode(RADIANS);
  select("canvas").elt.style.letterSpacing = "4px";

  // textLetterSpacing(1);
}

function draw() {
  if (emotionData.length < 1) {
    console.log("no data yet");
    return;
  }
  background("#EFEDE7");
  fill("black");
  textFont("Helvetica Neue");
  textSize(7);

  currSeconds = getSeconds() - startTime;
  for (const [emotion, endPos] of Object.entries(emotionEndPos)) {
    stroke("black");
    strokeWeight(0.5);
    line(width / 2, height / 2, endPos.x, endPos.y);
    push();
    const angle = Math.atan2(endPos.y - height / 2, endPos.x - width / 2);

    translate(width / 2, height / 2);
    rotate(angle);
    fill("black");
    noStroke();
    text(emotion.toUpperCase(), width / 4, -5);
    pop();
  }
  currIdx = Math.floor(currSeconds) % emotionData.length;
  const entry = emotionData[currIdx];

  updateParticles(entry);
  drawParticles();
}

function legend(entry) {
  // console.log(entry);
  text(`entryIdx: ${currIdx}`, 10, 20);
  let i = 0;
  try {
    for (const emotion of Object.entries(emotionColors)) {
      noStroke();
      fill("black");
      text(`${emotion[0]} :${entry[emotion[0]]}`, 70, 40 + i * 20);

      fill(emotion[1]);
      stroke("black");
      rect(50, 30 + i * 20, 10, 10);
      i++;
    }
    noStroke();
    fill("black");
    text(`sentiment :${entry["sentiment"]}`, 70, 40 + i * 20);
  } catch {
    console.log(entry);
  }
}
//keep track of the previous second
let prevUpdateIdx = 0;
function updateParticles(entry) {
  if (prevUpdateIdx != currIdx) {
    //save this so u dont re update
    for (const emotion of emotionList) {
      const val = entry[emotion];
      if (val > 0) {
        const numParticles = Math.ceil(val * 300); //add a particle for each decimal place, can do more
        const letters = entry["dialogue"];
        for (let i = 0; i < numParticles; i++) {
          createParticle(
            emotion,
            val,
            entry["colors"][i % entry["colors"].length],
            letters[i % letters.length]
          );
        }
      }
    }
    prevUpdateIdx = currIdx;
  }
}
function getSaturation([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let s = 0;
  if (max !== 0) s = delta / max;

  return s;
}
function createParticle(emotion, val, color, symbol) {
  const speed = val * 3;
  const size = Math.max(map(Math.pow(getSaturation(color), 2), 0, 1, 1, 8), 0);
  if (isNaN(size) || size == 0) {
  } else {
    particles.push(new EmotionParticle(emotion, speed, color, size, symbol));
  }
}

function drawParticles() {
  for (const particle of particles) {
    particle.run();
  }
}
