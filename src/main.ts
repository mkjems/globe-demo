import './style.css'
import * as THREE from 'three'

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

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create points on a sphere
  const particleCount = 200;
  const positions = [];

  for (let i = 0; i < particleCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();

    const radius = 1.6;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions.push(x, y, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const material = new THREE.PointsMaterial({
    color: 0x67e8f9,
    size: 0.015,
    transparent: true,
    opacity: 0.85
  });

  const globe = new THREE.Points(geometry, material);
  scene.add(globe);

  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener("mousemove", (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);

    globe.rotation.y += 0.001;
    globe.rotation.x += 0.0003;

    // subtle mouse influence
    globe.rotation.y += mouseX * 0.001;
    globe.rotation.x += mouseY * 0.001;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });
