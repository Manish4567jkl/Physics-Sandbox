import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

// --- CANNON PHYSICS ---
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
  broadphase: new CANNON.SAPBroadphase(),
  allowSleep: true, // Allow sleeping for stability
});

const defaultMaterial = new CANNON.Material('default');
const groundMaterial = new CANNON.Material('groundMaterial');

const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, groundMaterial, {
  friction: 0.3,       // More friction = less sliding madness
  restitution: 0.9,    // Balanced bounciness
});
world.defaultContactMaterial = defaultContactMaterial;
world.addContactMaterial(defaultContactMaterial);

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#A7C7E7');

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 20);
camera.lookAt(0, 0, 0);

const canvas = document.querySelector("canvas.cubeexp");
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.minDistance = 1;
controls.maxDistance = 500;

// Ground mesh + physics
const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({color:"#fdf0d5", side: THREE.DoubleSide})
);
groundMesh.rotation.x = -Math.PI/2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane(),
  material: groundMaterial,
});
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
world.addBody(groundBody);

// Grid helper and lights
scene.add(new THREE.GridHelper(200, 200));

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Cubes array
const cubes = [];

function createCube(pos) {
  const size = THREE.MathUtils.randFloat(1, 6);
  const halfSize = size/2;
  const mass = size * 2; // scale mass with size
  const cubeMaterialPhysics = new CANNON.Material('cubeMaterial');

  // Contact material with ground for this cube material
  const contactMat = new CANNON.ContactMaterial(cubeMaterialPhysics, groundMaterial, {
    friction: 0.3,       // decent friction
    restitution: 0.9,    // moderate bounce
  });
  world.addContactMaterial(contactMat);

  const shape = new CANNON.Box(new CANNON.Vec3(halfSize, halfSize, halfSize));
  const body = new CANNON.Body({
    mass,
    shape,
    material: cubeMaterialPhysics,
    position: new CANNON.Vec3(pos.x, halfSize, pos.z),
    linearDamping: 0.2,   // Slight damping to reduce jitter
    angularDamping: 0.5,  // Higher damping to prevent flipping
    allowSleep: true,
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 1,
  });

  // Remove impulse spin to keep it realistic and stable

  world.addBody(body);

  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial({color: new THREE.Color(Math.random(), Math.random(), Math.random())});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  scene.add(mesh);

  cubes.push({body, mesh});
}

// Spawn more cubes scattered around with spacing


const planeSize = 200; 
const cubeCount = 90;   
const cubePositions = [];

for (let i = 0; i < cubeCount; i++) {
  const x = (Math.random() - 0.5) * planeSize; // -100 to 100
  const z = (Math.random() - 0.5) * planeSize; // -100 to 100
  const y = 0; 

  cubePositions.push(new THREE.Vector3(x, y, z));
}
cubePositions.forEach(pos => createCube(pos));

// Player setup
const playerSize = 3;
const playerMaterialPhysics = new CANNON.Material('playerMaterial');
const playerShape = new CANNON.Box(new CANNON.Vec3(playerSize/2, playerSize/2, playerSize/2));
const playerBody = new CANNON.Body({
  mass: 7,
  shape: playerShape,
  material: playerMaterialPhysics,
  position: new CANNON.Vec3(0, playerSize/2, 0),
  linearDamping: 0.4,
  angularDamping: 0.7,
  allowSleep: false,
});
playerBody.sleepSpeedLimit = 0;
world.addBody(playerBody);

const playerGeometry = new THREE.BoxGeometry(playerSize, playerSize, playerSize);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: "#ff6347",           // base color
  emissive: "#ff6347",        // glow color
  emissiveIntensity: 1.5,     // how strong the glow is
  roughness: 0.3,
  metalness: 0.1
});
const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
playerMesh.castShadow = true;
scene.add(playerMesh);


// Contact materials for player
const playerGroundContact = new CANNON.ContactMaterial(playerMaterialPhysics, groundMaterial, {
  friction: 0.4,
  restitution: 0.5,
});
world.addContactMaterial(playerGroundContact);

const playerCubeContact = new CANNON.ContactMaterial(playerMaterialPhysics, defaultMaterial, {
  friction: 0.5,
  restitution: 0.3,
});
world.addContactMaterial(playerCubeContact);

// Controls & Nitro setup
const keysPressed = {};
let isCharging = false;
let nitroCharge = 0;
const maxNitro = 200;
const chargeRate = 90;
let nitroActive = false;

window.addEventListener('keydown', (e) => {
  keysPressed[e.key.toLowerCase()] = true;
  if (e.code === 'ShiftLeft') isCharging = true;  // Left Shift pressed
});

window.addEventListener('keyup', (e) => {
  keysPressed[e.key.toLowerCase()] = false;
  if (e.code === 'ShiftLeft') isCharging = false; // Left Shift released
});





const maxSpeed = 20;
const acceleration = 15;
const turnSpeed = 2.5;
let velocity = 0;
let steeringAngle = 0;

function updatePlayerMovement(delta) {
  if (isCharging && velocity > 0.1 && !nitroActive) {
    nitroCharge = Math.min(maxNitro, nitroCharge + chargeRate * delta);
   const hue = 0.03 + (nitroCharge / maxNitro) * 0.4;   // more hue range
   const saturation = 1;                                // full color punch
   const lightness = 0.45 + (nitroCharge / maxNitro) * 0.25; // brighter when charged
   playerMaterial.color.setHSL(hue, saturation, lightness);

  } else {
    playerMaterial.color.set("#ff6347");
  }

  if (!isCharging && nitroCharge > 0 && !nitroActive && velocity > 0.1) {
    nitroActive = true;
    velocity += 100;
    nitroCharge = 0;
  }

  if (!nitroActive) {
    if (keysPressed['w']) velocity += acceleration * delta;
    else if (keysPressed['s']) velocity -= acceleration * delta;
    else velocity *= 0.95;
  } else {
    velocity *= 0.96;
    if (velocity < maxSpeed) nitroActive = false;
  }

  if (keysPressed['a']) steeringAngle += turnSpeed * delta * (velocity > 0 ? 1 : -1);
  if (keysPressed['d']) steeringAngle -= turnSpeed * delta * (velocity > 0 ? 1 : -1);

  if (Math.abs(velocity) < 0.1) {
    steeringAngle *= 0.8;
  }

  const quat = new CANNON.Quaternion();
  quat.setFromEuler(0, steeringAngle, 0, 'YZX');
  playerBody.quaternion.copy(quat);

  const forwardVector = new CANNON.Vec3(0, 0, -1);
  playerBody.quaternion.vmult(forwardVector, forwardVector);

  playerBody.position.vadd(forwardVector.scale(velocity * delta), playerBody.position);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});



const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();

  updatePlayerMovement(delta);
  world.step(1/60, delta, 3);
  // Keep player grounded
  playerBody.position.y = playerSize / 2;
  playerBody.velocity.y = 0;

  // Sync meshes with bodies
  playerMesh.position.copy(playerBody.position);
  playerMesh.quaternion.copy(playerBody.quaternion);

  cubes.forEach(({body, mesh}) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
