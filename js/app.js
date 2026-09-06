// Main wiring: camera capture, MediaPipe face tracking, per-frame render of
// the chosen deity's headwear/aura/particles, and photo capture.
//
// The MediaPipe library is loaded lazily (dynamic import, inside
// initFaceLandmarker) rather than as a static top-level import. A static
// import that fails to fetch aborts evaluation of the *entire* module, which
// would take the deity picker and all other UI down with it over a plain
// network hiccup. Loading it on demand means only camera start-up degrades
// if the CDN is unreachable — everything else on the page still works.

const els = {
  video: document.getElementById('cam'),
  canvas: document.getElementById('stage'),
  startBtn: document.getElementById('startBtn'),
  captureBtn: document.getElementById('captureBtn'),
  status: document.getElementById('status'),
  grid: document.getElementById('deityGrid'),
  activeName: document.getElementById('activeName'),
  activeTagline: document.getElementById('activeTagline'),
  result: document.getElementById('result'),
  resultImg: document.getElementById('resultImg'),
  downloadBtn: document.getElementById('downloadBtn'),
  closeResult: document.getElementById('closeResult'),
};

const ctx = els.canvas.getContext('2d');

let faceLandmarker = null;
let stream = null;
let running = false;
let currentDeity = DEITIES[0];
let activeParticles = currentDeity.particles();
let lastTime = performance.now();
let noFaceFrames = 0;

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle('error', isError);
}

function buildDeityGrid() {
  DEITIES.forEach((d) => {
    const btn = document.createElement('button');
    btn.className = 'deity-chip';
    btn.dataset.id = d.id;
    btn.innerHTML = `<span class="chip-name">${d.name}</span><span class="chip-title">${d.title}</span>`;
    btn.style.setProperty('--aura', d.aura);
    btn.addEventListener('click', () => selectDeity(d.id));
    els.grid.appendChild(btn);
  });
  updateActiveChip();
}

function selectDeity(id) {
  const d = DEITIES.find((x) => x.id === id);
  if (!d) return;
  currentDeity = d;
  activeParticles = d.particles();
  els.activeName.textContent = d.name;
  els.activeTagline.textContent = d.tagline;
  updateActiveChip();
}

function updateActiveChip() {
  [...els.grid.children].forEach((c) => c.classList.toggle('active', c.dataset.id === currentDeity.id));
}

async function initFaceLandmarker() {
  setStatus('Loading face-tracking model…');
  const { FaceLandmarker, FilesetResolver } = await import(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
  );
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    runningMode: 'VIDEO',
    numFaces: 1,
  });
}

async function startCamera() {
  els.startBtn.disabled = true;
  try {
    if (!faceLandmarker) await initFaceLandmarker();
    setStatus('Requesting camera…');
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    els.video.srcObject = stream;
    await els.video.play();
    els.canvas.width = els.video.videoWidth;
    els.canvas.height = els.video.videoHeight;
    running = true;
    lastTime = performance.now();
    els.captureBtn.disabled = false;
    els.startBtn.textContent = 'Camera running';
    setStatus('Hold your face in frame — pick a deity below.');
    requestAnimationFrame(renderLoop);
  } catch (err) {
    console.error(err);
    els.startBtn.disabled = false;
    if (err && err.name === 'NotAllowedError') {
      setStatus('Camera permission was denied — allow camera access and try again.', true);
    } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      setStatus('Camera access needs HTTPS (or localhost). Serve this app over HTTPS, e.g. GitHub Pages.', true);
    } else {
      setStatus('Could not start the camera or load the face-tracking model. ' + (err && err.message ? err.message : ''), true);
    }
  }
}

function getPoint(landmarks, i, w, h) {
  const p = landmarks[i];
  return { x: p.x * w, y: p.y * h };
}

function renderLoop(now) {
  if (!running) return;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const w = els.canvas.width, h = els.canvas.height;
  ctx.save();
  ctx.scale(-1, 1); // mirror so it behaves like a selfie mirror
  ctx.translate(-w, 0);
  ctx.drawImage(els.video, 0, 0, w, h);
  ctx.restore();

  const results = faceLandmarker.detectForVideo(els.video, now);
  const landmarks = results && results.faceLandmarks && results.faceLandmarks[0];

  if (landmarks) {
    noFaceFrames = 0;
    // Landmark indices per MediaPipe's 468/478-point canonical face mesh.
    const forehead = getPoint(landmarks, 10, w, h);
    const chin = getPoint(landmarks, 152, w, h);
    const leftEdge = getPoint(landmarks, 234, w, h);
    const rightEdge = getPoint(landmarks, 454, w, h);

    // Mirror x to match the flipped video draw above.
    const mirror = (p) => ({ x: w - p.x, y: p.y });
    const fh = mirror(forehead), ch = mirror(chin), le = mirror(leftEdge), re = mirror(rightEdge);

    const faceWidth = Math.hypot(re.x - le.x, re.y - le.y);
    const faceHeight = Math.hypot(fh.x - ch.x, fh.y - ch.y);
    const angle = Math.atan2(re.y - le.y, re.x - le.x); // roll from ear-line to ear-line
    // Anchor sits above the forehead point, extended along the chin->forehead vector.
    const dirX = (fh.x - ch.x), dirY = (fh.y - ch.y);
    const dirLen = Math.hypot(dirX, dirY) || 1;
    const anchor = {
      x: fh.x + (dirX / dirLen) * faceHeight * 0.32,
      y: fh.y + (dirY / dirLen) * faceHeight * 0.32,
    };

    drawAura(anchor.x, anchor.y, faceWidth, currentDeity.aura);

    const hw = currentDeity.headwear;
    Draw[hw.type](ctx, anchor.x, anchor.y, angle, faceWidth, hw.opts);
  } else {
    noFaceFrames++;
    if (noFaceFrames === 40) setStatus('No face detected — center your face in the frame.');
  }

  activeParticles.update(dt, w, h);
  activeParticles.render(ctx);

  requestAnimationFrame(renderLoop);
}

function drawAura(x, y, scale, color) {
  const r = scale * 0.9;
  const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  grad.addColorStop(0, hexToRgba(color, 0.35));
  grad.addColorStop(1, hexToRgba(color, 0));
  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function capturePhoto() {
  const dataUrl = els.canvas.toDataURL('image/png');
  els.resultImg.src = dataUrl;
  els.downloadBtn.href = dataUrl;
  els.downloadBtn.download = `${currentDeity.id}-filter.png`;
  els.result.hidden = false;
}

els.startBtn.addEventListener('click', startCamera);
els.captureBtn.addEventListener('click', capturePhoto);
els.closeResult.addEventListener('click', () => { els.result.hidden = true; });

buildDeityGrid();
selectDeity(currentDeity.id);

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  setStatus('This browser does not support camera access (getUserMedia). Try a recent Chrome, Edge, or Safari.', true);
  els.startBtn.disabled = true;
}
