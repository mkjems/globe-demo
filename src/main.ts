import './style.css'
import * as THREE from 'three'
import { createCoordinateGrid, createLandDots } from './globeObjects'
import { loadLandPoints } from './landPoints'

const globeRadius = 1.6;

async function init() {
  const landPoints = await loadLandPoints();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.z = 4;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const globeGroup = new THREE.Group();
  globeGroup.add(createCoordinateGrid(globeRadius));
  globeGroup.add(createLandDots(landPoints, globeRadius));
  scene.add(globeGroup);

  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);

    globeGroup.rotation.y += 0.001;
    globeGroup.rotation.x += 0.0003;

    globeGroup.rotation.y += mouseX * 0.001;
    globeGroup.rotation.x += mouseY * 0.001;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

init().catch((error) => {
  console.error(error);
});
