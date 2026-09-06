# Pantheon

A real-time camera filter: hold up your phone or laptop camera, pick a Greek
god or goddess, and see their crown, aura, and ambient effects tracked live
onto your face. Everything runs client-side in the browser — no photo or
video frame ever leaves the device, and there is no backend, API key, or
per-use cost.

## How it works

- **Face tracking** — [MediaPipe Face Landmarker](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
  (loaded from Google's CDN, runs via WebAssembly in the browser) tracks 478
  facial landmarks per frame from the live camera feed.
- **Headwear/aura/particles** — drawn procedurally on a `<canvas>` with plain
  2D canvas paths (no image assets), scaled and rotated off the tracked face
  width, forehead point, and roll angle. See `js/deities.js` for the
  per-deity definitions and `js/particles.js` for the ambient particle
  systems (lightning, embers, water drops, petals, stars, drifting shapes).
- **Capture** — "Capture photo" snapshots the current canvas (video +
  overlay composited) to a downloadable PNG.

12 Olympians plus Hades are included: Zeus, Poseidon, Hades, Apollo, Ares,
Hermes, Hephaestus, Athena, Hera, Aphrodite, Artemis, Demeter, Dionysus.

## Running it

Camera access requires a secure context — **HTTPS, or `localhost`**. Opening
`index.html` directly via `file://` will not work in most browsers.

**Locally**, serve the folder with any static file server, e.g.:

```sh
python3 -m http.server 8080
# then open http://localhost:8080
```

**Deploying**, the simplest option is GitHub Pages: push this repo, enable
Pages for it (Settings → Pages → Deploy from branch), and it will serve over
HTTPS automatically with no build step — it's plain HTML/CSS/JS.

## Browser support

Needs a modern browser with `getUserMedia` and WebAssembly support (recent
Chrome, Edge, Safari, or Firefox on desktop or mobile). The face-tracking
model (~a few MB) downloads from Google's CDN on first load and is cached by
the browser after that.

## Adding another deity

Add an entry to the `DEITIES` array in `js/deities.js`: give it an `id`,
`name`, `title`, `tagline`, an `aura` color, a `headwear` (one of the
`Draw.*` primitives — `leafWreath`, `radialCrown`, `circlet`, or `helmet` —
with its options), and a `particles` factory from `js/particles.js` (or a
new one). No image assets required.
