// Procedural canvas textures. Everything the game shows is drawn at
// runtime, so the entry loads no image, font or sound file from anywhere.

import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

export function windowsTexture(base, lit, litRatio, seed) {
  const [c, ctx] = canvas(128, 256);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 128, 256);
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let y = 8; y < 248; y += 16) {
    for (let x = 8; x < 120; x += 14) {
      ctx.fillStyle = rnd() < litRatio ? lit : '#14100c';
      ctx.fillRect(x, y, 9, 11);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function roadTexture() {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = '#2b2b30'; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#3a3a40';
  for (let i = 0; i < 500; i++) ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  ctx.fillStyle = '#d8c25a';
  ctx.fillRect(124, 0, 4, 256);
  ctx.fillStyle = '#e8e8e8';
  for (let y = 0; y < 256; y += 42) ctx.fillRect(30, y, 5, 22);
  for (let y = 0; y < 256; y += 42) ctx.fillRect(221, y, 5, 22);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function sandTexture() {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = '#d9b380'; ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#c9a26e';
  for (let i = 0; i < 300; i++) ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 1);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function waterTexture() {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = '#2f7d9c'; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    ctx.beginPath();
    const y = Math.random() * 256;
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 32) ctx.lineTo(x, y + Math.sin(x / 40 + i) * 5);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function kioskSignTexture(word, bg, fg) {
  const [c, ctx] = canvas(256, 64);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = fg;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(word, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
