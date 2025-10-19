let audioData;
let currIdx = 0;
let currSeconds;
let entry;
let startTime = 0;
const speed = 30;
const width = 600;
const height = window.innerHeight - 50;
let dataSummary = {};
let binScales = {};
const sideSpace = 10;
let timeScale;
let timeScaleX;
const maxHeight = 50;

function getSeconds() {
  return 60 + (Math.floor((millis() / 1000) * 2) / 2) * speed;
}
function loadData() {
  d3.json("../../data/spiritedaway/audioSceneData.json", d3.autoType).then(
    (data) => {
      audioData = data;
      console.log("data", audioData);

      const features = Object.keys(data[0]);
      for (const feature of features) {
        dataSummary[feature] = {
          min: d3.min(audioData, (d) => d[feature]),
          max: d3.max(audioData, (d) => d[feature]),
          mean: d3.mean(audioData, (d) => d[feature]),
        };
      }

      for (let i = 1; i <= 12; i++) {
        const f = `mfcc_${i}_mean`;
        binScales[f] = d3
          .scalePow()
          .exponent(2)

          .domain([dataSummary[f].min, dataSummary[f].max])
          .range([0, 1]);
      }
      console.log(dataSummary);
      timeScale = d3
        .scaleLinear()
        .domain([dataSummary["seconds"].min, dataSummary["seconds"].max])
        .range([maxHeight, height * 2]);
      timeScaleX = d3
        .scaleLinear()
        .domain([dataSummary["seconds"].min, dataSummary["seconds"].max])
        .range([0, width]);
    }
  );
}
loadData();
function setup() {
  createCanvas(width, height);
  startTime = getSeconds();
  createButton("start").mousePressed(() => {
    startTime = getSeconds();
  });
  background("#EFEDE7");
}

function draw() {
  if (audioData.length < 1) {
    return;
  }
  // background("#EFEDE7");
  // fill("black");
  // textFont("Helvetica Neue");

  currSeconds = getSeconds() - startTime;
  currIdx = Math.floor(currSeconds / 10) * 10;
  entry = audioData[currIdx % audioData.length];

  // text(
  //   `current time: ${Math.floor(currSeconds)} , entryIdx: ${currIdx}`,
  //   10,
  //   20
  // );
  push();
  // translate(timeScaleX(currSeconds) - sideSpace, 0);
  drawSpectralCenter();
  pop();
}

function drawSpectralCenter() {
  // circle

  const feature = "spectral_centroid_mean";
  const val = interpFeature(feature);

  const scaledVal = map(
    val,
    dataSummary[feature].min,
    dataSummary[feature].max,
    0,
    1
  );

  const yPos = timeScale(Math.floor(currSeconds));
  line(-width, yPos, width * 2, yPos);

  const freq = 10;

  // bins on top
  const rectW = (width - sideSpace * 2) / 12;
  fill("#EFEDE7");
  stroke("black");
  strokeWeight(0.2);
  beginShape();
  curveTightness(0);

  let binH;
  let i;

  curveVertex(0, yPos);
  // curveVertex(0, yPos);
  curveVertex(sideSpace - 10, yPos - 5);
  for (i = 1; i <= 12; i++) {
    const f = `mfcc_${i}_mean`;
    binH = maxHeight * binScales[`mfcc_${i}_mean`](interpFeature(f));
    const x = sideSpace + (i - 1) * rectW;
    const y = yPos - binH;

    curveVertex(x, y);
    curveVertex(x + rectW / 2, y);
  }

  curveVertex(width - sideSpace, yPos - 4);
  curveVertex(width, yPos);

  // curveVertex(width - sideSpace, yPos);
  // curveVertex(width - sideSpace, yPos);
  // curveVertex(sideSpace - 10, yPos);
  // ellipse(width - sideSpace, height / 2, 10, 10);

  endShape(CLOSE);
  fill("black");
  circle(
    sideSpace + scaledVal * (width - sideSpace * 2),
    yPos - maxHeight / 2,
    2,
    2
  );
}

function interpFeature(feature) {
  const n = audioData.length;
  if (!n) return 0;

  const STEP = 10;
  const baseIdx = (Math.floor(currSeconds / STEP) * STEP) % n;
  const nextIdx = (baseIdx + STEP) % n;

  const alpha = (currSeconds % STEP) / STEP;

  const a = +audioData[baseIdx][feature];
  const b = +audioData[nextIdx][feature];
  const ease = alpha * alpha * (3 - 2 * alpha);
  return lerp(a, b, ease);
}
// add near your globals
let tiltAngle = 0; // smoothed angle in degrees

function tilt() {
  const a = interpFeature("spectral_centroid_mean");
  const rel =
    (a - dataSummary.spectral_centroid_mean.mean) /
    (dataSummary.spectral_centroid_mean.max -
      dataSummary.spectral_centroid_mean.min);
  const targetDeg = 30 * rel;

  const t = 0.15;
  const ease = t * t * (3 - 2 * t);
  tiltAngle = lerp(tiltAngle, targetDeg, ease);

  const pivotX = sideSpace + (width - sideSpace * 2) / 2;
  const pivotY = height / 2;

  translate(pivotX, pivotY);
  rotate(radians(tiltAngle));
  translate(-pivotX, -pivotY);
}
