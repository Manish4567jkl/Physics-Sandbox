import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Initialize the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020); // Set a visible background

// Initialize the camera
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  400
);
camera.position.set(0, 10, 50); // Move the camera back to see everything

// 💡 Add Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft global light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 20);
directionalLight.castShadow = true;
scene.add(directionalLight);

// 🎯 Add a Sphere
const sphereGeometry = new THREE.SphereGeometry(3, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(-10, 3, 0);
scene.add(sphere);

// 🎯 Add a Cube
const boxGeometry = new THREE.BoxGeometry(5, 5, 5);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xff5733 });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
box.position.set(0, 3, 0);
scene.add(box);

// 🎯 Add a Cylinder
const cylinderGeometry = new THREE.CylinderGeometry(2, 2, 6, 32);
const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(10, 3, 0);
scene.add(cylinder);

// 🎯 Add a Torus (Donut)
const torusGeometry = new THREE.TorusGeometry(4, 1.5, 16, 100);
const torusMaterial = new THREE.MeshStandardMaterial({ color: 0xf39c12 });
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.position.set(0, 6, -10);
scene.add(torus);

// 🎯 Add a Cone
const coneGeometry = new THREE.ConeGeometry(3, 8, 32);
const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
const cone = new THREE.Mesh(coneGeometry, coneMaterial);
cone.position.set(0, 4, 10);
scene.add(cone);

// Initialize the renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Add controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxDistance = 200;
controls.minDistance = 20;

// Add resize listener
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render loop
const renderloop = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(renderloop);
};

renderloop();
