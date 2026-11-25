// camera.js — zoom-only camera: wheel / pinch to zoom, double-click /
// double-tap to reset the zoom. No rotation: dragging the mouse never moves
// the camera (Mu: the spinning view looked messy). No libraries, no CDN.
// The camera sits at a fixed angle on the default view; distance (zoom)
// is clamped so it never goes under the floor or so far it loses the
// kitchen. Movement is damped (goal vs current).
import * as THREE from 'three';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// keep angles in [-PI, PI] so the azimuth never grows without bound
const wrapAngle = (a) => {
  a = (a + Math.PI) % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a - Math.PI;
};

// Default view = the camera the game has always opened with:
// position (0, 6.6, 6.6) looking at (0, 0.9, -3.0).
export const CAMERA_DEFAULTS = {
  target: new THREE.Vector3(0, 0.9, -3.0),
  azimuth: 0,
  polar: 1.03,
  distance: 11.16,
};

// Azimuth is fixed: no input ever changes it (screenshot presets may set
// their own angle via syncFromCamera, and it stays put after that).
export const CAMERA_LIMITS = {
  minDistance: 6, maxDistance: 16,
  minPolar: 0.35, maxPolar: 1.25,
};

export function createOrbitCamera(camera, dom, opts = {}) {
  const onTap = opts.onTap || (() => {});
  // hitTest(e) -> true when the pointer is over something clickable
  // (a station): a double-tap there is two station clicks, not a reset.
  const hitTest = opts.hitTest || (() => false);
  const defaults = {
    target: (opts.target || CAMERA_DEFAULTS.target).clone(),
    azimuth: opts.azimuth ?? CAMERA_DEFAULTS.azimuth,
    polar: opts.polar ?? CAMERA_DEFAULTS.polar,
    distance: opts.distance ?? CAMERA_DEFAULTS.distance,
  };
  const target = defaults.target.clone();
  // goal = where input wants the camera; current = damped, what is rendered
  let goal = { azimuth: defaults.azimuth, polar: defaults.polar, distance: defaults.distance };
  let cur = { ...goal };

  const pointers = new Map(); // pointerId -> { x, y }
  let pinchDist = 0;
  let downPos = null;
  let moved = 0;
  let dragging = false;
  let lastTapTime = 0;

  function apply() {
    const sp = Math.sin(cur.polar), cp = Math.cos(cur.polar);
    camera.position.set(
      target.x + cur.distance * sp * Math.sin(cur.azimuth),
      target.y + cur.distance * cp,
      target.z + cur.distance * sp * Math.cos(cur.azimuth),
    );
    camera.lookAt(target);
  }

  function update(dt) {
    const k = 1 - Math.exp(-dt * 10); // frame-rate independent damping
    // shortest-arc damping for azimuth (only presets set it, via
    // syncFromCamera — no input changes it after that)
    cur.azimuth = wrapAngle(cur.azimuth + wrapAngle(goal.azimuth - cur.azimuth) * k);
    cur.polar += (goal.polar - cur.polar) * k;
    cur.distance += (goal.distance - cur.distance) * k;
    apply();
  }

  // Re-derive the orbit state from wherever the camera currently is
  // (used after a screenshot preset sets the camera by hand).
  function syncFromCamera() {
    const off = camera.position.clone().sub(target);
    const d = Math.max(off.length(), 0.001);
    goal.distance = cur.distance = clamp(d, CAMERA_LIMITS.minDistance, CAMERA_LIMITS.maxDistance);
    goal.polar = cur.polar = clamp(Math.acos(clamp(off.y / d, -1, 1)), CAMERA_LIMITS.minPolar, CAMERA_LIMITS.maxPolar);
    goal.azimuth = cur.azimuth = wrapAngle(Math.atan2(off.x, off.z));
    apply();
  }

  function reset() {
    target.copy(defaults.target);
    goal = { azimuth: defaults.azimuth, polar: defaults.polar, distance: defaults.distance };
    cur = { ...goal }; // snap: no slow drift back on a reset
    apply();
  }

  function setTarget(v) { target.copy(v); }

  function onPointerDown(e) {
    try { dom.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers can't be captured */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      downPos = { x: e.clientX, y: e.clientY };
      moved = 0;
      dragging = false;
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      dragging = true; // a pinch is never a tap
    }
  }

  function onPointerMove(e) {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0 && d > 0) {
        goal.distance = clamp(goal.distance * (pinchDist / d), CAMERA_LIMITS.minDistance, CAMERA_LIMITS.maxDistance);
      }
      pinchDist = d;
      return;
    }
    if (pointers.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 5) dragging = true; // >5px = a drag, not a click
      // a drag moves nothing: rotation was removed (Mu: it looked messy).
      // dragging is still tracked so a drag is never mistaken for a tap.
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size > 0) return; // another finger still down: no tap
    const wasTap = !dragging && downPos && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) <= 5;
    dragging = false;
    downPos = null;
    if (!wasTap) return;
    const t = performance.now();
    if (t - lastTapTime < 300 && !hitTest(e)) {
      // double-tap on empty space: reset the camera, swallow the tap
      lastTapTime = 0;
      reset();
      return;
    }
    lastTapTime = t;
    onTap(e);
  }

  function onWheel(e) {
    e.preventDefault();
    goal.distance = clamp(goal.distance * Math.exp(e.deltaY * 0.001), CAMERA_LIMITS.minDistance, CAMERA_LIMITS.maxDistance);
  }

  function onDoubleClick(e) {
    if (!hitTest(e)) reset(); // double-click on a station is two clicks, not a reset
  }

  dom.style.touchAction = 'none'; // let pointer events drive touch drag/pinch
  dom.addEventListener('pointerdown', onPointerDown);
  dom.addEventListener('pointermove', onPointerMove);
  dom.addEventListener('pointerup', onPointerUp);
  dom.addEventListener('pointercancel', onPointerUp);
  dom.addEventListener('wheel', onWheel, { passive: false });
  dom.addEventListener('dblclick', onDoubleClick);

  apply();
  return {
    update, reset, syncFromCamera, setTarget,
    state: () => ({
      azimuth: +cur.azimuth.toFixed(3),
      polar: +cur.polar.toFixed(3),
      distance: +cur.distance.toFixed(2),
      target: target.toArray().map((v) => +v.toFixed(2)),
    }),
  };
}
