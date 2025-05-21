import * as THREE from 'three';
import * as CANNON from "cannon-es";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ————— THREE.JS SETUP —————
const scene = new THREE.Scene();
scene.background = new THREE.Color('#A7C7E7');

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 10, 10);
camera.lookAt(0, 0, 0);

const canvas = document.querySelector("canvas.explosion");
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxDistance = 200;
controls.minDistance = 20;
controls.enableZoom = true;

// ————— CANNON-ES SETUP —————
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
    
});
world.broadphase = new CANNON.SAPBroadphase(world); // better broadphase
world.allowSleep = true; // let objects "nap" for performance

const timeStep = 1 / 60;

// ————— GROUND —————
const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: "#D08C9B", side: THREE.DoubleSide })
);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    position: new CANNON.Vec3(0, 0, 0)
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const gridHelper = new THREE.GridHelper(200, 200);
scene.add(gridHelper);

// ————— LIGHTS —————
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 10, 5);
light.castShadow = true;
scene.add(light);

// ————— EXPLOSION CIRCLE —————
let currentRadius = 2;
let circleGeometry = new THREE.CircleGeometry(currentRadius, 64);
circleGeometry.rotateX(-Math.PI / 2);

const circleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5500,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
});
const explosionCircle = new THREE.Mesh(circleGeometry, circleMaterial);
explosionCircle.position.y = 0.01;
scene.add(explosionCircle);

// ————— MOUSE TRACKING —————
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('wheel', (event) => {
    if (event.shiftKey) {
        event.preventDefault();
        controls.enableZoom = false;
        const delta = event.deltaY;
        const sizeDelta = delta > 0 ? -0.2 : 0.2;
        currentRadius = THREE.MathUtils.clamp(currentRadius + sizeDelta, 0.5, 20);
        explosionCircle.geometry.dispose();
        explosionCircle.geometry = new THREE.CircleGeometry(currentRadius, 64);
        explosionCircle.geometry.rotateX(-Math.PI / 2);
    } else {
        controls.enableZoom = true;
    }
}, { passive: false });

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const wallHeight = 40;
const wallThickness = 10;
const halfGroundSize = 100;
const ceilingY = 80; // give ‘em sky to soar

// ——— WALL POSITIONS ———
const wallPositions = [
  { x: halfGroundSize + wallThickness / 2, y: wallHeight / 2, z: 0, rotY: 0 }, // Right
  { x: -halfGroundSize - wallThickness / 2, y: wallHeight / 2, z: 0, rotY: 0 }, // Left
  { x: 0, y: wallHeight / 2, z: halfGroundSize + wallThickness / 2, rotY: Math.PI / 2 }, // Front
  { x: 0, y: wallHeight / 2, z: -halfGroundSize - wallThickness / 2, rotY: Math.PI / 2 }, // Back
];

wallPositions.forEach(({ x, y, z, rotY }) => {
  const wallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, halfGroundSize * 2 + wallThickness * 2);
  const wallMat = new THREE.MeshBasicMaterial({ visible: false });
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  wallMesh.position.set(x, y, z);
  wallMesh.rotation.y = rotY;
  scene.add(wallMesh);

  const wallShape = new CANNON.Box(new CANNON.Vec3(
    wallThickness / 2,
    wallHeight / 2,
    halfGroundSize + wallThickness
  ));
  const wallBody = new CANNON.Body({ mass: 0, shape: wallShape });
  wallBody.position.set(x, y, z);
  wallBody.quaternion.setFromEuler(0, rotY, 0);
  world.addBody(wallBody);
});

// ——— CEILING ———
const ceilingGeo = new THREE.BoxGeometry(halfGroundSize * 2 + wallThickness * 2, wallThickness, halfGroundSize * 2 + wallThickness * 2);
const ceilingMat = new THREE.MeshBasicMaterial({ visible: false });
const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
ceilingMesh.position.set(0, ceilingY, 0);
scene.add(ceilingMesh);

const ceilingShape = new CANNON.Box(new CANNON.Vec3(
  (halfGroundSize + wallThickness),
  wallThickness / 2,
  (halfGroundSize + wallThickness)
));
const ceilingBody = new CANNON.Body({ mass: 0, shape: ceilingShape });
ceilingBody.position.set(0, ceilingY, 0);
world.addBody(ceilingBody);




// ————— PHYSICS OBJECTS —————
const boxes = [];

// Spawn a single box with given position, size, and color
function spawnBox(x, y, z, size = 1, colorHex = 0x8844aa) {
    const boxGeo = new THREE.BoxGeometry(size, size, size);
    const boxMat = new THREE.MeshStandardMaterial({ color: colorHex });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.castShadow = true;
    boxMesh.position.set(x, y, z);
    scene.add(boxMesh);

    const boxShape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
    const boxBody = new CANNON.Body({
        mass: 1,
        shape: boxShape,
        position: new CANNON.Vec3(x, y, z)
    });
    boxBody.velocity.set(0, 0, 0);
    boxBody.angularVelocity.set(0, 0, 0);

    world.addBody(boxBody);

    boxes.push({ mesh: boxMesh, body: boxBody });
}

// Spawn a stacked tower of boxes with varying sizes/colors
function spawnTower(x, z, height = 5) {
    for (let i = 0; i < height; i++) {
        const size = 0.8 + Math.random() * 0.7; // size between 0.8 and 1.5
        const color = new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`);
        spawnBox(x, size / 2 + i * size, z, size, color.getHex());
    }
}

// Clear previous boxes before spawning (optional)
function clearBoxes() {
    boxes.forEach(({ mesh, body }) => {
        scene.remove(mesh);
        world.removeBody(body);
    });
    boxes.length = 0;
}

// ————— INITIAL STRUCTURE SPAWNING —————
clearBoxes();

for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 60;

    if (Math.random() < 0.5) {
        // Single box with random size and color
        const size = 0.5 + Math.random() * 1.5;
        const color = new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`);
        const y = size / 2 + Math.random() * 3;
        spawnBox(x, y, z, size, color.getHex());
    } else {
        // Tower of boxes
        const height = Math.floor(Math.random() * 5) + 3; // 3 to 7 boxes tall
        spawnTower(x, z, height);
    }
}

// ————— EXPLOSION FUNCTION —————
function triggerExplosion(strength = 80) {
    const center = explosionCircle.position;

    boxes.forEach(({ body }) => {
        const distance = body.position.distanceTo(center);
        if (distance < currentRadius) {
            const forceDirection = new CANNON.Vec3().copy(body.position).vsub(center);
            forceDirection.normalize();
            const force = forceDirection.scale((1 - distance / currentRadius) * strength);
            body.applyImpulse(force, body.position);
        }
    });
}

// ————— MOUSE CLICK EVENTS —————
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        triggerExplosion(100); // Left click = BIG explosion
    } else if (e.button === 2) {
        triggerExplosion(30); // Right click = gentle puff
    }
});
window.addEventListener('contextmenu', e => e.preventDefault()); // disable right-click menu

// ————— ANIMATE —————
const animate = () => {
    controls.update();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(groundMesh);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        explosionCircle.position.set(point.x, point.y + 0.01, point.z);
    }

    world.step(timeStep);

    boxes.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

animate();
