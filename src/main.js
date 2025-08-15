// Matter.js Engine Setup
const { Engine, Render, World, Bodies, Runner } = Matter;
const engine = Engine.create();
const world = engine.world;

const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Color list (40 pastel shades)
const pastelColors = [
    '#FFB6C1', '#A1C4FD', '#FFD700', '#98FB98', '#FFDAC1',
    '#E0BBE4', '#D5AAFF', '#B5EAD7', '#FF9AA2', '#FFB347',
    '#AFF8DB', '#B28DFF', '#FFFFD1', '#FFABAB', '#FFC3A0',
    '#F8B195', '#C1E1C1', '#FFDEAD', '#E6E6FA', '#C3FDB8',
    '#FAD0C4', '#F1F0C0', '#D0F0C0', '#FDC5F5', '#C2F0FC',
    '#FFE2E2', '#D9F3FF', '#FFF4E0', '#E2F0CB', '#FCE1E4',
    '#F0E5CF', '#FFDBE9', '#DCF8C6', '#F3D1F4', '#F0C5C5',
    '#F8E9A1', '#EAD7D1', '#C6D8D3', '#FBE4D8', '#F0F8FF'
];

function randomPastelColor() {
    return pastelColors[Math.floor(Math.random() * pastelColors.length)];
}

// Trail effect (basic implementation)
const trails = [];

// Standard ball spawn (left click)
function spawnBall(x, y) {
    const radius = Math.random() * 10 + 10;
    const ball = Bodies.circle(x, y, radius, {
        restitution: 1.0,
        friction: 0.001,
        density: 0.001,
        render: {
            fillStyle: randomPastelColor()
        }
    });
    World.add(world, ball);
}

// Glowing ball with trail (right click)
function spawnBouncyBall(x, y) {
    const radius = Math.random() * 10 + 15;
    const color = randomPastelColor();
    const ball = Bodies.circle(x, y, radius, {
        restitution: 1.7,
        friction: 0.00005,
        density: 0.0005,
        render: {
            fillStyle: color,
            strokeStyle: color,
            lineWidth: 5
        }
    });
    World.add(world, ball);
    trails.push({ body: ball, color });
}



// Spawn 30 balls on load
for (let i = 0; i < 30; i++) {
    spawnBall(Math.random() * window.innerWidth, Math.random() * 200);
}

// Left click = normal, right click = glowy ball
document.addEventListener("mousedown", (event) => {
    if (event.button === 2) { // Right click
        event.preventDefault();
        spawnBouncyBall(event.clientX, event.clientY);
    } else if (event.button === 0) { // Left click
        spawnBall(event.clientX, event.clientY);
    }
});

// Platforms
const platformSettings = { isStatic: true, render: { fillStyle: '#ffffff88' } };
const bouncyPlatformSettings = { isStatic: true, restitution: 70.2, render: { fillStyle: '#ffcc88' } };

const platforms = [
    Bodies.rectangle(window.innerWidth / 2 - 300, 100, 350, 15, { ...platformSettings, angle: Math.PI * 0.3 }),
    Bodies.rectangle(window.innerWidth / 2 + 300, 180, 350, 15, { ...platformSettings, angle: -Math.PI * 0.3 }),
    Bodies.rectangle(window.innerWidth / 2 - 250, 260, 320, 15, { ...platformSettings, angle: Math.PI * 0.2 }),
    Bodies.rectangle(window.innerWidth / 2 + 250, 340, 320, 15, { ...platformSettings, angle: -Math.PI * 0.2 }),
    Bodies.rectangle(window.innerWidth / 3, 400, 280, 15, platformSettings),
    Bodies.rectangle(window.innerWidth * 0.75, 450, 280, 15, platformSettings),
    Bodies.rectangle(window.innerWidth / 2 - 230, 500, 280, 15, bouncyPlatformSettings),
    Bodies.rectangle(window.innerWidth / 2 + 230, 570, 280, 15, bouncyPlatformSettings),
    Bodies.rectangle(window.innerWidth / 2, 640, 280, 15, platformSettings)
];
World.add(world, platforms);

// Trampoline
const trampoline = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 40, window.innerWidth, 20, {
    isStatic: true,
    restitution: 80.3,
    render: { fillStyle: '#ff69b4' }
});
World.add(world, trampoline);

// Side walls
const sideBarrierOptions = { isStatic: true, render: { fillStyle: '#ffffff00' } };
World.add(world, [
    Bodies.rectangle(0, window.innerHeight / 2, 20, window.innerHeight, sideBarrierOptions),
    Bodies.rectangle(window.innerWidth, window.innerHeight / 2, 20, window.innerHeight, sideBarrierOptions)
]);

// Clouds (decor only)
function createClouds(count) {
    const cloudContainer = document.querySelector(".clouds");
    for (let i = 0; i < count; i++) {
        let cloud = document.createElement("div");
        cloud.classList.add("cloud");
        cloud.style.top = Math.random() * 80 + "%";
        cloud.style.left = Math.random() * -150 + "px";
        cloud.style.animationDuration = (Math.random() * 20 + 20) + "s";
        cloud.style.transform = `scale(${Math.random() * 0.8 + 0.6})`;
        cloudContainer.appendChild(cloud);
    }
}
createClouds(15);

// Background color animation
let time = 0;
function updateBackground() {
    time += 0.0015;
    const r = Math.floor(120 + 80 * Math.sin(time));
    const g = Math.floor(180 + 50 * Math.sin(time + 2));
    const b = Math.floor(250 + 5 * Math.sin(time + 4));
    document.body.style.background = `rgb(${r}, ${g}, ${b})`;
    requestAnimationFrame(updateBackground);
}
updateBackground();

// Play button redirect
document.getElementById("playButton").addEventListener("click", () => {
    window.location.href = "/src/html/mode-selection.html";
});
