var http = require('http');
var fs = require('fs');
var mjpegServer = require('mjpeg-server');

const { createCanvas, loadImage } = require('canvas');
const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8081
const canvas = createCanvas(WIDTH, HEIGHT);

const ctx = canvas.getContext('2d');
let timer = -1;
let handlers = new Set();

let r = 117, g = 221, b = 221;
let spin = 0.1;
let cSpin = 0.1;
let lastDate = new Date();
ctx.scale(WIDTH/1280, HEIGHT/720);

function updateJPG() {
  let v = 360 + Math.floor(Math.sin(spin-1)*300);
  let gradient = ctx.createLinearGradient(0, v, 1280, 720 - v);
  gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
  let stops = 3;
  for (let x=1; x<stops; x++) {
    r = (127 + Math.floor(Math.sin(cSpin)*100)) % 256;
    g = (127 + Math.floor(Math.sin(cSpin-5)*100)) % 256;
    b = (127 + Math.floor(Math.sin(cSpin-10)*100)) % 256;
    gradient.addColorStop((1/stops)*x, `rgb(${r}, ${g}, ${b})`);
    cSpin = (cSpin + 0.025) % (Math.PI*2);
  }
  spin = (spin + 0.1) % (Math.PI*2);
  ctx.clearRect(0,0,1280,720);
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,1280,720);
  ctx.fillStyle = `rgb(${256-r}, ${256-g}, ${256-b})`;
  ctx.font = "128px \"Menlo\"";
  ctx.textAlign = "center";
  const now = new Date();
  const dstr = new Date().toLocaleString().split(", ")[1];
  ctx.translate(1280/2, 720/2);
  ctx.rotate((Math.sin(spin)/10));
  ctx.translate(-1280/2, -720/2);

  ctx.fillText(dstr, (1280/2) + Math.floor(Math.sin(spin-1)*25), (720/2) - 40 + Math.floor(Math.sin(spin+0.2)*20)); 
  ctx.font = "32px \"Menlo\"";
  ctx.textAlign = "center";
  
  const fps = ((1 / (now.getTime() - lastDate.getTime())) * 1000).toFixed(2);
  ctx.fillText(`${WIDTH}x${HEIGHT} MJPEG Test Stream`, (1280/2) + Math.floor(Math.sin(spin)*25), (720/2) + 50 + Math.floor(Math.sin(spin-0.3)*20));
  ctx.fillText(`rendering at ${fps}fps`, (1280/2) + Math.floor(Math.sin(spin)*25), (720/2) + 90 + Math.floor(Math.sin(spin-0.5)*20));
  ctx.fillText(`${handlers.size} connected client(s)`, (1280/2) + Math.floor(Math.sin(spin)*25), (720/2) + 130 + Math.floor(Math.sin(spin-0.9)*20));

  const buf3 = canvas.toBuffer('image/jpeg', { quality: 0.8 });
  for (const handler of handlers) {
    handler.write(buf3);
  }
  ctx.translate(1280/2, 720/2);
  ctx.rotate(-(Math.sin(spin)/10));
  ctx.translate(-1280/2, -720/2);
  lastDate = now;
  if (handlers.size <= 0) {
    clearInterval(timer);
    timer = -1;
    console.log('No more requests. Stopping canvas');
  }
}

http.createServer(function(req, res) {
  console.log("Got request");

  const mjpegReqHandler = mjpegServer.createReqHandler(req, res);
  handlers.add(mjpegReqHandler);

  if (timer === -1) {
    timer = setInterval(updateJPG, 1000/FPS);
  }
  
  req.on('close',function(){
    handlers.delete(mjpegReqHandler);
    mjpegReqHandler.close();
  });

}).listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on port ${PORT}`);
});
