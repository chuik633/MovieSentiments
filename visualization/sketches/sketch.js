let audioData;
let currIdx = 0;
let currSeconds;
let entry;
let startTime = 0;
const speed = 10;
const width = window.innerWidth;
const height = window.innerHeight - 100;
let dataSummary;

function getSeconds() {
  return 60 + Math.floor((millis() / 1000) * speed);
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
      console.log(dataSummary);
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
}

function draw() {
  if (audioData.length < 1) {
    return;
  }
  background("#EFEDE7");
  fill("black");
  textFont("Helvetica Neue");

  currSeconds = getSeconds() - startTime;
  currIdx = Math.floor(currSeconds / 10) * 10;
  entry = audioData[currIdx % audioData.length];

  text(`current time: ${currSeconds} , entryIdx: ${currIdx}`, 10, 20);
  drawSpectralCenter();
}

function drawSpectralCenter() {
  line(10, height / 2, width - 10, height / 2);
  entry["spectral_centroid"];
}
