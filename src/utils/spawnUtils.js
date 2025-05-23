// spawnUtils.js

// These must be defined in the global scope of your main file:
// scene, world, and boxes

function spawnBox(x, y, z, size = 1, colorHex = 0x8844aa, mass = 1) {
    const boxGeo = new THREE.BoxGeometry(size, size, size);
    const boxMat = new THREE.MeshStandardMaterial({ color: colorHex });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.castShadow = true;
    boxMesh.position.set(x, y, z);
    scene.add(boxMesh);

    const halfSize = size / 2;
    const boxShape = new CANNON.Box(new CANNON.Vec3(halfSize, halfSize, halfSize));
    const boxBody = new CANNON.Body({
        mass: mass,
        shape: boxShape,
        position: new CANNON.Vec3(x, y, z)
    });

    boxBody.velocity.set(0, 0, 0);
    boxBody.angularVelocity.set(0, 0, 0);

    world.addBody(boxBody);
    boxes.push({ mesh: boxMesh, body: boxBody });

    return { mesh: boxMesh, body: boxBody };
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

function spawnCylinder(x, y, z, radiusTop = 1, radiusBottom = 1, height = 2, colorHex = 0xffc1cc, mass = 1) {
    radiusTop = Math.max(0.001, radiusTop);
    radiusBottom = Math.max(0.001, radiusBottom);

    const cylGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    const cylMat = new THREE.MeshStandardMaterial({ color: colorHex });
    const cylMesh = new THREE.Mesh(cylGeo, cylMat);
    cylMesh.castShadow = true;
    cylMesh.position.set(x, y, z);
    scene.add(cylMesh);

    const cylShape = new CANNON.Cylinder(radiusTop, radiusBottom, height, 16);
    const quat = new CANNON.Quaternion();
    quat.setFromEuler(-Math.PI / 2, 0, 0);
    cylShape.transformAllPoints(new CANNON.Vec3(), quat);

    const cylBody = new CANNON.Body({
        mass: mass,
        shape: cylShape,
        position: new CANNON.Vec3(x, y, z),
        quaternion: quat.clone()
    });

    world.addBody(cylBody);
    boxes.push({ mesh: cylMesh, body: cylBody });

    return { mesh: cylMesh, body: cylBody };
}

function spawnHouse(x, z) {
    const baseSize = 2;
    const baseHeight = 1;
    const upperSize = 1.2;
    const upperHeight = 0.8;
    const baseY = baseHeight / 2;

    const base = spawnBox(x, baseY, z, baseSize, 0xffe29f);
    base.body.sleep();
    base.body.allowSleep = true;

    const upperY = baseHeight + upperHeight / 2;
    const offsetX = 0.3;
    const offsetZ = -0.3;
    const upper = spawnBox(x + offsetX, upperY, z + offsetZ, upperSize, 0xe0bbff);
    upper.body.sleep();
    upper.body.allowSleep = true;

    const cylHeight = 0.6;
    const cylRadius = 0.25;
    const cylY = upperY + upperHeight / 2 + cylHeight / 2;
    const chimney = spawnCylinder(x + offsetX, cylY, z + offsetZ, cylRadius, cylRadius, cylHeight, 0xcbb8ff);
    chimney.body.sleep();
    chimney.body.allowSleep = true;
}

function spawnTower(x, z, height = 5) {
    let currentY = 0;
    for (let i = 0; i < height; i++) {
        const size = 0.9 + Math.random() * 0.7;
        const color = new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`);
        currentY += size / 2;
        spawnBox(x, currentY, z, size, color.getHex());
        currentY += size / 2;
    }
}

function spawnTown(centerX = 0, centerZ = 0) {
    const spacing = 7;
    const gridSize = 1;

    for (let row = -gridSize; row <= gridSize + 1; row++) {
        for (let col = -gridSize; col <= gridSize + 1; col++) {
            const x = centerX + col * spacing;
            const z = centerZ + row * spacing;
            const rand = Math.random();

            if (rand < 0.4) {
                spawnHouse(x, z);
            } else if (rand < 0.75) {
                const floors = 2 + Math.floor(Math.random() * 2);
                spawnTower(x, z, floors);
            } else {
                const height = 3;
                spawnCylinder(x, height / 2, z, 1, 1, height, 0xa0c4ff, 1);
            }
        }
    }
}
