import Matter from 'https://cdn.skypack.dev/matter-js';

(() => {
  const { Engine, Render, Runner, World, Bodies, Body } = Matter;

  const canvas = document.querySelector('.loader-canvas');
  const width = window.innerWidth;
  const height = window.innerHeight;

  const engine = Engine.create();
  const world = engine.world;
  engine.gravity.y = 0;

  const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: { width, height, wireframes: false, background: 'transparent' }
  });

  Render.run(render);
  Runner.run(Runner.create(), engine);

  // pastel balls for loader
  const colors = ['#FFB6C1','#A1C4FD','#FFD700','#98FB98','#FFDAC1','#E0BBE4','#D5AAFF','#B5EAD7'];
  const balls = [];

  for (let i=0;i<25;i++){
    const ball = Bodies.circle(Math.random()*width, Math.random()*height, 10+Math.random()*15, {
      restitution: 1.2, frictionAir: 0.05,
      render:{ fillStyle: colors[Math.floor(Math.random()*colors.length)] }
    });
    balls.push(ball);
  }
  World.add(world, balls);

  // walls so balls stay on screen
  const walls = [
    Bodies.rectangle(width/2, -50, width, 100, {isStatic:true}),
    Bodies.rectangle(width/2, height+50, width, 100, {isStatic:true}),
    Bodies.rectangle(-50, height/2, 100, height, {isStatic:true}),
    Bodies.rectangle(width+50, height/2, 100, height, {isStatic:true})
  ];
  World.add(world, walls);

  // fun: push all balls gently toward center periodically
  setInterval(()=>{
    balls.forEach(b=>{
      const dx = width/2 - b.position.x;
      const dy = height/2 - b.position.y;
      Body.applyForce(b, b.position, {x: dx*0.00001, y: dy*0.00001});
    });
  },100);

  // Fade out loader after 2s
  setTimeout(()=>{
    const loader = document.getElementById('loader');
    loader.style.transition = 'opacity 0.5s';
    loader.style.opacity = '0';
    setTimeout(()=>loader.remove(),500);
  },2000);
})();