const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;

const container = document.getElementById("matter-container");
const render = Render.create({
  element: container,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent"
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);

const pastelColors = [
  "#ffd6e0", "#e0ffe4", "#e0f7fa", "#fff7d6",
  "#ffe6cc", "#d6f0ff", "#f7e0ff", "#ffebf2"
];

const walls = [
  Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 60, window.innerWidth, 120, { isStatic: true }),
  Bodies.rectangle(window.innerWidth / 2, -60, window.innerWidth, 120, { isStatic: true }),
  Bodies.rectangle(-60, window.innerHeight / 2, 120, window.innerHeight, { isStatic: true }),
  Bodies.rectangle(window.innerWidth + 60, window.innerHeight / 2, 120, window.innerHeight, { isStatic: true })
];
World.add(world, walls);

function randomPastelShape(x, y) {
  const opts = {
    restitution: 0.9,
    frictionAir: 0.02,
    render: {
      fillStyle: pastelColors[Math.floor(Math.random() * pastelColors.length)],
      strokeStyle: "rgba(255,255,255,0.6)",
      lineWidth: 2
    }
  };
  const shapes = [
    () => Bodies.circle(x, y, 15 + Math.random() * 20, opts),
    () => Bodies.rectangle(x, y, 25 + Math.random() * 20, 25 + Math.random() * 20, opts),
    () => Bodies.polygon(x, y, 5, 20 + Math.random() * 15, opts)
  ];
  return shapes[Math.floor(Math.random() * shapes.length)]();
}

function spawnShapes(count = 30) {
  for (let i = 0; i < count; i++) {
    World.add(world, randomPastelShape(Math.random() * window.innerWidth, -50));
  }
}

function clearWorld() {
  World.clear(world, false);
  World.add(world, walls);
}

// Mode logic
function setSandboxMode() {
  clearWorld();
  engine.world.gravity.y = 0.3;
  spawnShapes(40);
}

function setChaosMode() {
  clearWorld();
  engine.world.gravity.y = 0.2;
  spawnShapes(60);

  const chaosCore = Bodies.circle(window.innerWidth / 2, window.innerHeight / 2, 80, {
    isStatic: true,
    render: { fillStyle: "rgba(255,255,255,0.15)" }
  });
  World.add(world, chaosCore);

  let t = 0;
  Events.on(engine, "beforeUpdate", () => {
    t += 0.02;
    Body.setPosition(chaosCore, {
      x: window.innerWidth / 2 + Math.sin(t) * 200,
      y: window.innerHeight / 2 + Math.cos(t) * 150
    });

    for (let body of world.bodies) {
      if (body.isStatic || body === chaosCore) continue;
      const dx = chaosCore.position.x - body.position.x;
      const dy = chaosCore.position.y - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 250) {
        const pull = 0.0008;
        const swirl = 0.0012;
        const angle = Math.atan2(dy, dx);
        const fx = Math.cos(angle) * pull - Math.sin(angle) * swirl;
        const fy = Math.sin(angle) * pull + Math.cos(angle) * swirl;
        Body.applyForce(body, body.position, { x: fx, y: fy });
      }
    }
  });
}

function setCubeClashMode() {
  clearWorld();
  engine.world.gravity.y = 1.2;
  for (let i = 0; i < 40; i++) {
    const opts = {
      restitution: 0.4,
      render: {
        fillStyle: pastelColors[Math.floor(Math.random() * pastelColors.length)],
        strokeStyle: "rgba(255,255,255,0.6)",
        lineWidth: 2
      }
    };
    World.add(world, Bodies.rectangle(
      Math.random() * window.innerWidth,
      Math.random() * -200,
      30, 30, opts
    ));
  }
}

// Button bindings


// Start in sandbox mode
setSandboxMode();
