import Matter from 'https://cdn.skypack.dev/matter-js';

(() => {
  const {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    Events,
    Mouse,
    MouseConstraint
  } = Matter;

  const container = document.getElementById('matter-container');
  let width = window.innerWidth;
  let height = window.innerHeight;

  const engine = Engine.create();
  engine.gravity.y = 0;

  const world = engine.world;

  const render = Render.create({
    element: container,
    engine: engine,
    options: {
      width,
      height,
      wireframes: false,
      background: 'transparent',
      pixelRatio: window.devicePixelRatio,
    }
  });
  Render.run(render);
  Runner.run(Runner.create(), engine);

  const walls = [
    Bodies.rectangle(width / 2, height + 60, width, 120, { isStatic: true }),
    Bodies.rectangle(width / 2, -60, width, 120, { isStatic: true }),
    Bodies.rectangle(-60, height / 2, 120, height, { isStatic: true }),
    Bodies.rectangle(width + 60, height / 2, 120, height, { isStatic: true }),
  ];
  World.add(world, walls);

  // More vivid pastel colors for that extra pop
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

  const shapes = [];

  function createShape(x, y) {
    const opts = {
      restitution: 1.2,
      frictionAir: 0.05,
      density: 0.01,
      render: {
        fillStyle: pastelColors[Math.floor(Math.random() * pastelColors.length)],
        strokeStyle: 'rgba(255, 255, 255, 0.3)',
        lineWidth: 2
      }
    };

    const shapeTypes = [
      () => Bodies.circle(x, y, 15 + Math.random() * 15, opts),
      () => Bodies.rectangle(x, y, 30 + Math.random() * 20, 30 + Math.random() * 20, opts),
      () => Bodies.polygon(x, y, 5, 20 + Math.random() * 15, opts),
      () => Bodies.polygon(x, y, 6, 18 + Math.random() * 15, opts)
    ];

    const shape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)]();
    World.add(world, shape);
    shapes.push(shape);
    return shape;
  }

  // Spawn initial shapes with more color diversity
  for (let i = 0; i < 55; i++) {
    createShape(Math.random() * width, Math.random() * height);
  }

  function radialBurst(x, y, radius = 130, strength = 0.4) {
    shapes.forEach(body => {
      const dx = body.position.x - x;
      const dy = body.position.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius) {
        const forceMagnitude = strength * (1 - dist / radius);
        const angle = Math.atan2(dy, dx);
        Body.applyForce(body, body.position, {
          x: Math.cos(angle) * forceMagnitude,
          y: Math.sin(angle) * forceMagnitude,
        });
      }
    });
  }

  render.canvas.addEventListener('pointerdown', e => {
    if (e.target.closest('#ui')) return; // ignore UI clicks

    const rect = render.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newShape = createShape(x, y);

    // Quick flash effect on new shape
    const originalFill = newShape.render.fillStyle;
    newShape.render.fillStyle = '#ffffff';
    setTimeout(() => {
      newShape.render.fillStyle = originalFill;
    }, 150);

    radialBurst(x, y);
  });

  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.12, render: { visible: false } }
  });
  World.add(world, mouseConstraint);

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    render.canvas.width = width;
    render.canvas.height = height;
    render.options.width = width;
    render.options.height = height;

    Body.setPosition(walls[0], { x: width / 2, y: height + 60 });
    Body.setPosition(walls[1], { x: width / 2, y: -60 });
    Body.setPosition(walls[2], { x: -60, y: height / 2 });
    Body.setPosition(walls[3], { x: width + 60, y: height / 2 });
  });

  // Smooth fade & redirect on button clicks
  function fadeAndRedirect(url) {
    let opacity = 1;
    const fade = () => {
      opacity -= 0.04;
      document.body.style.background = `rgba(240, 245, 255, ${opacity})`;
      if (opacity > 0) requestAnimationFrame(fade);
      else window.location.href = url;
    };
    fade();
  }

  document.getElementById('btn-sandbox').onclick = () => fadeAndRedirect('./sandbox.html');
  document.getElementById('btn-explosions').onclick = () => fadeAndRedirect('./explosionmode.html');
  document.getElementById('btn-cube').onclick = () => fadeAndRedirect('./cubecollision.html');
})();
