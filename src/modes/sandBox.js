import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//? Creating the scene and camera with positioning
const scene = new THREE.Scene();
scene.background = new THREE.Color("#A7C7E7");
const camera = new THREE.PerspectiveCamera(
    45, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000 
);
camera.position.set(5, 10, 10);
camera.lookAt(0, 0, 0);

//? Creating canvas and renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const control = new OrbitControls(camera, canvas);
control.update();

//? Creating the cannon-es world for physics
const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);

//? Wind force
let windForce = new CANNON.Vec3(0, 0, 0);
const windSlider = document.getElementById("wind-slider");
const windDisplay = document.getElementById("wind-value");

windSlider.addEventListener("input", () => {
    const forceValue = parseFloat(windSlider.value);
    windDisplay.textContent = `${forceValue} N`;
    windForce.set(forceValue, 0, 0);
});

//? Sliders for gravity
const slider = document.getElementById("gravity-slider");
const display = document.getElementById("gravity-value");

slider.addEventListener("input", () => {
    display.textContent = `${slider.value} m/s²`;
    world.gravity.set(0, slider.value, 0);
});

//? Creating materials for physics objects
const groundMaterial = new CANNON.Material("ground");
const sphereMaterial = new CANNON.Material("sphere");
const cubeMaterial = new CANNON.Material("cube");

//? Contact materials
const groundSphereContact = new CANNON.ContactMaterial(groundMaterial, sphereMaterial, {
    friction: 0.4,
    restitution: 0.8 
});
const groundCubeContact = new CANNON.ContactMaterial(groundMaterial, cubeMaterial, {
    friction: 0.6,
    restitution: 0.3 
});

world.addContactMaterial(groundSphereContact);
world.addContactMaterial(groundCubeContact);

//? Creating Ground - Both cannonjs and threejs
const groundBody = new CANNON.Body({
    shape: new CANNON.Plane(),
    mass: 0,
    material: groundMaterial
});
groundBody.position.set(0, -0.5, 0);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: "#D08C9B", side: THREE.DoubleSide })
);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.5;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

//? Grid helper
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

//? Lighting 
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 10, 5);
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
scene.add(light);

const clock = new THREE.Clock();
const objectsToUpdate = [];

let newSphereMass = 1;
let newCubeMass = 1;

const sphereMassSlider = document.getElementById("sphere-mass-slider");
const sphereMassDisplay = document.getElementById("sphere-mass-value");

sphereMassSlider.addEventListener("input", () => {
    sphereMassDisplay.textContent = `${sphereMassSlider.value} kg`;
    newSphereMass = parseFloat(sphereMassSlider.value);
});

const cubeMassSlider = document.getElementById("cube-mass-slider");
const cubeMassDisplay = document.getElementById("cube-mass-value");

cubeMassSlider.addEventListener("input", () => {
    cubeMassDisplay.textContent = `${cubeMassSlider.value} kg`;
    newCubeMass = parseFloat(cubeMassSlider.value);
});

function animate() {
    const delta = clock.getDelta();
    world.step(1 / 60, delta, 3);
    control.update();
    objectsToUpdate.forEach(obj => {
        obj.body.applyForce(windForce, obj.body.position);
        obj.mesh.position.copy(obj.body.position);
        obj.mesh.quaternion.copy(obj.body.quaternion);
    });
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

window.addEventListener("click", spawnCube);
window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    spawnSphere();
});

const pastelColors = ["#FFC8DD", "#FFAFCC", "#BDE0FE", "#A2D2FF", "#CDB4DB"];

function spawnCube() {
    const x = (Math.random() - 0.5) * 15;
    const y = 5;
    const z = (Math.random() - 0.5) * 15;
    const color = pastelColors[Math.floor(Math.random() * pastelColors.length)];

    const newCubeBody = new CANNON.Body({
        mass: newCubeMass,
        shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
        position: new CANNON.Vec3(x, y, z),
        material: cubeMaterial
    });
    world.addBody(newCubeBody);

    const newCubeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color })
    );
    newCubeMesh.castShadow = true;
    scene.add(newCubeMesh);
    objectsToUpdate.push({ body: newCubeBody, mesh: newCubeMesh });
}

function spawnSphere() {
    const x = (Math.random() - 0.5) * 15;
    const y = 5;
    const z = (Math.random() - 0.5) * 15;
    const color = pastelColors[Math.floor(Math.random() * pastelColors.length)];

    const newSphereBody = new CANNON.Body({
        mass: newSphereMass,
        shape: new CANNON.Sphere(0.52),
        position: new CANNON.Vec3(x, y, z),
        material: sphereMaterial
    });
    world.addBody(newSphereBody);

    const newSphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.52, 32, 32),
        new THREE.MeshStandardMaterial({ color })
    );
    newSphereMesh.castShadow = true;
    scene.add(newSphereMesh);
    objectsToUpdate.push({ body: newSphereBody, mesh: newSphereMesh });
}
