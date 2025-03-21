import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    100 
);
camera.position.set(5, 10, 10);
camera.lookAt(0, 0, 0);

const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const control = new OrbitControls(camera, canvas);
control.update();

const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);

const groundMaterial = new CANNON.Material({ friction: 0.5, restitution: 0.8 });
const groundBody = new CANNON.Body({
    shape: new CANNON.Plane(),
    mass: 0,
    material: groundMaterial
});
groundBody.position.set(0, -0.5, 0);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: "#a0c4ff", side: THREE.DoubleSide })
);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.5;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const gridHelper = new THREE.GridHelper(40, 40);
scene.add(gridHelper);

const cubeMaterial = new CANNON.Material({ friction: 0.1, restitution: 1 });
const cubeBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
    position: new CANNON.Vec3(0, 8, 0),
    material: cubeMaterial
});
world.addBody(cubeBody);

const cubeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: "#ffafcc" })
);
cubeMesh.castShadow = true;
scene.add(cubeMesh);

const radius = 0.52;
const sphereMaterial = new CANNON.Material({ friction: 0.1, restitution: 1 });
const sphereBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Sphere(radius),
    position: new CANNON.Vec3(0, 8, 0),
    material: sphereMaterial
});
world.addBody(sphereBody);

const sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshStandardMaterial({ color: "#b9fbc0" })
);
sphereMesh.castShadow = true;
scene.add(sphereMesh);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 10, 5);
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
scene.add(light);

const clock = new THREE.Clock();
const objectsToUpdate = [
    { body: cubeBody, mesh: cubeMesh },
    { body: sphereBody, mesh: sphereMesh }
];

function animate() {
    const delta = clock.getDelta();
    world.step(1 / 60, delta, 3);
    control.update();
    objectsToUpdate.forEach(obj => {
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
const pastelColors = [
    "#FFC8DD", "#FFAFCC", "#BDE0FE", "#A2D2FF", "#CDB4DB",
    "#E4C1F9", "#B9FBC0", "#A0C4FF", "#FBC3BC", "#FDE4CF",
    "#C6DEF1", "#D8E2DC", "#FFD6A5", "#FFADAD", "#CAFFBF",
    "#9BF6FF", "#A8E6CF", "#DCEDC1", "#FFABAB", "#FFC3A0",
    "#F6D6AD", "#FBE7C6", "#D4A5A5", "#E5EAF5", "#C1CEFE",
    "#FFCBF2", "#F3C4FB", "#D8BFD8", "#F6E4F6", "#F4D1AE"
];

function spawnCube() {
    const x = (Math.random() - 0.5) * 15;
    const y = 5;
    const z = (Math.random() - 0.5) * 15;
    const color = pastelColors[Math.floor(Math.random() * 30)];

    const newCubeBody = new CANNON.Body({
        mass: 1,
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
    const color = pastelColors[Math.floor(Math.random() * 30)];

    const newSphereBody = new CANNON.Body({
        mass: 3,
        shape: new CANNON.Sphere(radius),
        position: new CANNON.Vec3(x, y, z),
        material: sphereMaterial
    });
    world.addBody(newSphereBody);

    const newSphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 32),
        new THREE.MeshStandardMaterial({ color })
    );
    newSphereMesh.castShadow = true;
    scene.add(newSphereMesh);
    objectsToUpdate.push({ body: newSphereBody, mesh: newSphereMesh });
}
