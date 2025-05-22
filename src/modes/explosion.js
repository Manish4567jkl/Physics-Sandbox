import * as THREE from 'three';
import * as CANNON from "cannon-es";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


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


const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
    
});
world.broadphase = new CANNON.SAPBroadphase(world); 
world.allowSleep = true; 

const timeStep = 1 / 60;

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


const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 10, 5);
light.castShadow = true;
scene.add(light);


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

const wallHeight = 80;
const wallThickness = 30;
const halfGroundSize = 50;
const ceilingY = 80; 


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





const boxes = [];


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


function spawnSphere(x, y, z, radius = 1, colorHex = 0x44aa88) {
    const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({ color: colorHex });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.castShadow = true;
    sphereMesh.position.set(x, y, z);
    scene.add(sphereMesh);

    const sphereShape = new CANNON.Sphere(radius);
    const sphereBody = new CANNON.Body({
        mass: 1,
        shape: sphereShape,
        position: new CANNON.Vec3(x, y, z)
    });

    world.addBody(sphereBody);

    boxes.push({ mesh: sphereMesh, body: sphereBody });
}


function spawnCylinder(x, y, z, radiusTop = 1, radiusBottom = 1, height = 2, colorHex = 0xaa8844) {
    const cylGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    const cylMat = new THREE.MeshStandardMaterial({ color: colorHex });
    const cylMesh = new THREE.Mesh(cylGeo, cylMat);
    cylMesh.castShadow = true;
    cylMesh.position.set(x, y, z);
    scene.add(cylMesh);

    const cylShape = new CANNON.Cylinder(radiusTop, radiusBottom, height, 32);


    const quat = new CANNON.Quaternion();
    quat.setFromEuler(-Math.PI / 2, 0, 0);
    cylShape.transformAllPoints(new CANNON.Vec3(), quat);

    const cylBody = new CANNON.Body({
        mass: 1,
        shape: cylShape,
        position: new CANNON.Vec3(x, y, z),
        quaternion: quat.clone()
    });

    world.addBody(cylBody);

    boxes.push({ mesh: cylMesh, body: cylBody });
}


function spawnHouse(x, z) {
    const baseSize = 2;
    const baseHeight = 1;

    // Base
    spawnBox(x, baseHeight / 2, z, baseSize, 0xB5651D); // brown

    // Roof mesh (visual only)
    const roofGeo = new THREE.ConeGeometry(baseSize * 0.9, baseHeight, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 }); // dark red
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(x, baseHeight + baseHeight / 2, z);
    roofMesh.castShadow = true;
    scene.add(roofMesh);

    // Roof body (approximate with a ConvexPolyhedron - pyramid)
    const half = (baseSize * 0.9) / 2;
    const roofHeight = baseHeight;

    const verts = [
        new CANNON.Vec3(-half, 0, -half),
        new CANNON.Vec3( half, 0, -half),
        new CANNON.Vec3( half, 0,  half),
        new CANNON.Vec3(-half, 0,  half),
        new CANNON.Vec3(0, roofHeight, 0) // top vertex
    ];

    const faces = [
        [0, 1, 2],
        [0, 2, 3],
        [0, 1, 4],
        [1, 2, 4],
        [2, 3, 4],
        [3, 0, 4]
    ];

    const roofShape = new CANNON.ConvexPolyhedron({ vertices: verts, faces });
    const roofBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(x, baseHeight + baseHeight / 2, z),
        shape: roofShape
    });

    world.addBody(roofBody);
    boxes.push({ mesh: roofMesh, body: roofBody });
}

function spawnTower(x, z, height = 5) {
    
    for (let i = 0; i < height; i++) {
        const size = 0.9+ Math.random() * 0.7; 
        const color = new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`);
        spawnBox(x, size / 2 + i * size, z, size, color.getHex());
    }
}

function spawnTown(centerX = 0, centerZ = 0) {
    const spacing = 6;

    for (let row = -1; row <= 1; row++) {
        for (let col = -1; col <= 1; col++) {
            const x = centerX + col * spacing;
            const z = centerZ + row * spacing;
            
            const rand = Math.random();
            if (rand < 0.4) {
                spawnHouse(x, z);
            } else if (rand < 0.7) {
                spawnTower(x, z, 3 + Math.floor(Math.random() * 3)); 
            } else {
                spawnCylinder(x, 1.5, z, 1, 1, 3, 0x888888); 
            }
        }
    }
}




function clearBoxes() {
    boxes.forEach(({ mesh, body }) => {
        scene.remove(mesh);
        world.removeBody(body);
    });
    boxes.length = 0;
}


clearBoxes();

clearBoxes();
spawnTown(0, 0); 

for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 60;
    const rand = Math.random();

    if (rand < 0.25) {
        const size = 0.5 + Math.random() * 1.5;
        const color = new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`);
        const y = size / 2 + Math.random() * 3;
        spawnBox(x, y, z, size, color.getHex());
    } else if (rand < 0.5) {
        const height = Math.floor(Math.random() * 5) + 3;
        spawnTower(x, z, height);
    } else if (rand < 0.75) {
        const radius = 0.5 + Math.random() * 1.5;
        const y = radius + Math.random() * 2;
        const color = new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`);
        spawnSphere(x, y, z, radius, color.getHex());
    } else {
        const radiusTop = 0.4 + Math.random() * 1.0;
        const radiusBottom = 0.4 + Math.random() * 1.0;
        const height = 1.0 + Math.random() * 2.0;
        const y = height / 2 + Math.random() * 2;
        const color = new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`);
        spawnCylinder(x, y, z, radiusTop, radiusBottom, height, color.getHex());
    }
}
spawnTown(-40, 30);
spawnTown(40, -30);
spawnTown(-60, -60); // Far bottom-left
spawnTown(60, 60);   // Far top-right
spawnTown(-70, 20);  // Far left-ish
spawnTown(20, -70);  // Deep south-ish


function spawnRandomPoof(x, y, z) {
    const poofTypes = [spawnPoofDust, spawnPoofFire, spawnPoofMagic, spawnPoofFairy, spawnPoofStar];
    const type = poofTypes[Math.floor(Math.random() * poofTypes.length)];
    type(x, y, z);
}

function spawnPoofDust(x, y, z) {
    spawnPoof(x, y, z, new THREE.Color(0xdcdcdc)); // light gray
}

function spawnPoofFire(x, y, z) {
    spawnPoof(x, y, z, new THREE.Color(0xffc2b4)); // pastel coral
}

function spawnPoofMagic(x, y, z) {
    spawnPoof(x, y, z, new THREE.Color(0xcaaaff)); // soft lavender
}

function spawnPoofFairy(x, y, z) {
    spawnPoof(x, y, z, new THREE.Color(0xa8ffe9)); // mint sparkle
}

function spawnPoofStar(x, y, z) {
    spawnPoof(x, y, z, new THREE.Color(0xfff0a8)); // pale gold
}



function spawnPoof(x, y, z, baseColor = 0xffe29f, scaleSpeed = 0.008, fadeSpeed = 0.01) {
   /*
    const pastelColors = [
        0xffc1cc, // strawberry milk
        0xaee6e6, // glacier mint
        0xcbb8ff, // soft lavender
        0xffe29f, // mango cream
        0xa0c4ff, // baby blue
        0xffffb3, // vanilla blush
        0xe0bbff  // orchid haze
    ];
*/

    const pastelColors = [
    0xff6f91, // punchy pink
    0x6fffe9, // bright mint
    0x9a8cff, // bold lavender
    0xffc75f, // vibrant mango
    0x00bfff, // strong baby blue
    0xffff66, // bright yellow
    0xcc99ff  // orchid haze (keep this)
];


    const poofGroup = new THREE.Group();
    const poofParticles = [];
    const particleCount = 18 + Math.floor(Math.random() * 12);

    for (let i = 0; i < particleCount; i++) {
        // Mix baseColor with a pastel for dreamy variety
        const base = new THREE.Color(baseColor);
        const pastel = new THREE.Color(pastelColors[Math.floor(Math.random() * pastelColors.length)]);
// Instead of base.lerp(pastel), swap it to pastel.lerp(base) for better saturation
        const t = 0.2 + Math.random() * 0.3;
        const color = pastel.clone().lerp(base, t);


        const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.03, 6, 6);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.85,
            roughness: 0.7,       // soft surface, no harsh reflections
            metalness: 0.2,       // subtle shimmer
            emissive: color.clone().multiplyScalar(0.4),  // gentle glow
            depthWrite: false,
            blending: THREE.NormalBlending
});


        const mesh = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI;
        const radius = 0.2 + Math.random() * 0.4;

        const dir = new THREE.Vector3(
            Math.cos(angle) * Math.sin(elevation),
            Math.cos(elevation),
            Math.sin(angle) * Math.sin(elevation)
        ).normalize().multiplyScalar(radius);

        mesh.position.set(x, y, z);
        poofGroup.add(mesh);

        poofParticles.push({
            mesh,
            velocity: dir,
            scaleSpeed: scaleSpeed + Math.random() * 0.002,
            fadeSpeed: fadeSpeed + Math.random() * 0.002
        });
    }

    scene.add(poofGroup);

    const updatePoof = () => {
        for (let i = poofParticles.length - 1; i >= 0; i--) {
            const p = poofParticles[i];
            p.mesh.position.add(p.velocity);
            p.mesh.scale.multiplyScalar(1 + p.scaleSpeed);
            p.mesh.material.opacity -= p.fadeSpeed;

            if (p.mesh.material.opacity <= 0) {
                poofGroup.remove(p.mesh);
                poofParticles.splice(i, 1);
            }
        }

        if (poofParticles.length > 0) {
            requestAnimationFrame(updatePoof);
        } else {
            scene.remove(poofGroup);
        }
    };

    updatePoof();
}



function triggerExplosion(strength = 80) {
    const center = explosionCircle.position;

    boxes.forEach(({ body }) => {
        const distance = body.position.distanceTo(center);
        if (distance < currentRadius) {
            const forceDirection = new CANNON.Vec3().copy(body.position).vsub(center);
            forceDirection.normalize();
            const force = forceDirection.scale((1 - distance / currentRadius) * strength);
            body.applyImpulse(force, body.position);

            // 🎇 Sparkly poof on every hit
            spawnRandomPoof(body.position.x, body.position.y, body.position.z);
        }
    });

    // 💥 Central dreamy burst
    spawnRandomPoof(center.x, center.y + 1, center.z);
}







window.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        triggerExplosion(100); 
    } else if (e.button === 2) {
        triggerExplosion(30); 
    }
});
window.addEventListener('contextmenu', e => e.preventDefault()); 


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
