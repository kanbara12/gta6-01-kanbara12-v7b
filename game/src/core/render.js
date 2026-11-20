// Renderer, sky and light. The sunset is a gradient dome with a real sun
// disc and glow, soft blob clouds, a warm key light from over the water
// and a warm bounce light so the shaded faces of buildings read as dark
// amber instead of near-black. Night swaps the dome for a deep blue one,
// drops the sun and leans on street and window light.

import * as THREE from 'three';
import { G } from './config.js';

function skyTexture(top, mid, low) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top); grad.addColorStop(0.5, mid); grad.addColorStop(0.78, '#ff7a2e'); grad.addColorStop(1, low);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 214, 130, 1)');
  g.addColorStop(0.35, 'rgba(255, 150, 70, 0.55)');
  g.addColorStop(1, 'rgba(255, 120, 40, 0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  const blob = (x, y, r, a) => {
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(255, 190, 150, ${a})`);
    g.addColorStop(1, 'rgba(255, 190, 150, 0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  };
  blob(70, 70, 46, 0.8); blob(120, 58, 58, 0.8); blob(175, 74, 44, 0.7); blob(210, 66, 30, 0.5);
  return new THREE.CanvasTexture(c);
}

export function buildRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(1280, 720);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.getElementById('stage').appendChild(renderer.domElement);
  G.renderer = renderer;
  G.camera = new THREE.PerspectiveCamera(60, 1280 / 720, 0.1, 1400);
  G.scene = new THREE.Scene();
  G.scene.fog = new THREE.Fog(0xd97a4e, 260, 900);
  return renderer;
}

export function buildSky(tod) {
  const scene = G.scene;
  const sunset = tod !== 'night';
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1100, 24, 14),
    new THREE.MeshBasicMaterial({
      map: sunset
        ? skyTexture('#2e2350', '#b64a6e', '#ff8a3c')
        : skyTexture('#060a1e', '#0d1533', '#27355e'),
      side: THREE.BackSide, fog: false,
    }),
  );
  scene.add(dome);

  if (sunset) {
    const sun = new THREE.Mesh(
      new THREE.CircleGeometry(34, 40),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, fog: false }),
    );
    sun.position.set(-250, 60, -120);
    sun.lookAt(0, 40, 0);
    scene.add(sun);
    G.sunDisc = sun;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(), transparent: true, depthWrite: false, fog: false,
    }));
    glow.position.copy(sun.position);
    glow.scale.set(320, 320, 1);
    scene.add(glow);
    G.sunGlow = glow;
  }

  // Soft clouds, never hard rectangles: stretched glow blobs, pink at
  // sunset, faint blue at night.
  const cloudTex = cloudTexture();
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cloudTex, transparent: true, opacity: sunset ? 0.75 : 0.35,
      depthWrite: false, fog: false,
      color: sunset ? 0xffc4a0 : 0x8fa0c8,
    }));
    const a = (i / 14) * Math.PI * 2 + 0.4;
    s.position.set(Math.cos(a) * (420 + (i % 5) * 60), 150 + (i % 4) * 42, -380 - (i % 3) * 120);
    s.scale.set(220 + (i % 3) * 90, 46 + (i % 3) * 14, 1);
    scene.add(s);
  }

  const hemi = new THREE.HemisphereLight(
    sunset ? 0xffb37a : 0x4a5a8a,
    sunset ? 0x6b4a3a : 0x1a2038,
    sunset ? 1.1 : 0.5,
  );
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(sunset ? 0xffb060 : 0x8fa0d8, sunset ? 2.0 : 0.7);
  sunLight.position.set(-260, 110, -260);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -260; sunLight.shadow.camera.right = 260;
  sunLight.shadow.camera.top = 260; sunLight.shadow.camera.bottom = -260;
  sunLight.shadow.camera.far = 900;
  scene.add(sunLight);
  // Warm bounce from the east so sunset-facing walls never go void black.
  const bounce = new THREE.DirectionalLight(0xff9a5a, 0.95);
  bounce.position.set(220, 60, 140);
  scene.add(bounce);
  G.lights = { hemi, sunLight, bounce };
}
