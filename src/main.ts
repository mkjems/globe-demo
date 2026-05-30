import './style.css'
import * as THREE from 'three'
import { createCameraControls } from './cameraControls'
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
  const controls = createCameraControls(camera, renderer.domElement);

  const globeGroup = new THREE.Group();
  globeGroup.add(createCoordinateGrid(globeRadius));
  globeGroup.add(createLandDots(landPoints, globeRadius));
  scene.add(globeGroup);

  function animate() {
    requestAnimationFrame(animate);

    globeGroup.rotation.y += 0.0001;

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.update();
  });
}

init().catch((error) => {
  console.error(error);
});
