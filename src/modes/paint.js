import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const scene = new THREE.Scene();
scene.background = new THREE.Color("#ffd8a9");


const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(20, 30, 20); 
camera.lookAt(0, 0, 0);





const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);


const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
directionalLight.position.set(10, 20, 10);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);




const canvas = document.querySelector('canvas.paint');
const renderer = new THREE.WebGLRenderer({
    canvas , antialias:true

})
renderer.setSize(window.innerWidth , window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio , 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.minDistance = 10;
controls.maxDistance = 300;

controls.enableZoom = true;
controls.enableRotate = true;
controls.enablePan = true;



const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(200,200),
    new THREE.MeshStandardMaterial({
        color : "white",
        side : THREE.DoubleSide,
        roughness:0.8
    })
)
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);


window.addEventListener("resize" , ()=> {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
})



const animate = () => {
    controls.update()
    renderer.render(scene,camera);
    window.requestAnimationFrame(animate);
};

animate();