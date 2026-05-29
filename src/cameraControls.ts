import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export function createCameraControls(
  camera: THREE.PerspectiveCamera,
  element: HTMLElement
) {
  const controls = new OrbitControls(camera, element);

  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 2.4;
  controls.maxDistance = 7;

  return controls;
}
