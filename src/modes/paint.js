import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class SimplexNoise {
  noise(x, y) {
    let total = 0;
    let frequency = 0.1;
    let amplitude = 1;
    let maxAmplitude = 0;

    // Sum 5 octaves for grainy fractal noise
    for (let i = 0; i < 5; i++) {
      total += (Math.sin(x * frequency + y * frequency * 1.3) + 
                Math.cos(y * frequency * 1.7 - x * frequency)) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= 0.5;   // reduce amplitude per octave
      frequency *= 2;     // increase frequency per octave
    }

    // Normalize result to [-1, 1]
    return total / maxAmplitude;
  }
}


// === Scene Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe29f); // warm creamy white

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 30, 20);
camera.lookAt(0, 0, 0);

// === Lights ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.mapSize.set(2048, 2048);
scene.add(directionalLight);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight.target);

// === Renderer & Controls ===
const canvas = document.querySelector('canvas.paint');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 300;

// === Procedural Fake Paper Ground ===
const simplex = new SimplexNoise();
const groundGeometry = new THREE.PlaneGeometry(200, 200, 256, 256);
const position = groundGeometry.attributes.position;
const vertex = new THREE.Vector3();

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);

  // Use improved fractal noise with scaled coords for better grain detail
  const noise = 1 * simplex.noise(vertex.x * 0.5, vertex.y * 0.5);

  vertex.z += noise;

  // Set the vertex position back in x, y, z order (plane geometry uses x,y,z)
  position.setXYZ(i, vertex.x, vertex.y, vertex.z);
}

groundGeometry.computeVertexNormals();

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1.0,
  metalness: 0.0,
  side: THREE.DoubleSide,
});

const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// === Resize Handling ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Animate ===
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
