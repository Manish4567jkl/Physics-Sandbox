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
           background: 'transparent'
       }
   });

   Render.run(render);
   const runner = Runner.create();
   Runner.run(runner, engine);

   // Create bouncing balls with different sizes
   function spawnBall(x, y) {
       const radius = Math.random() * 10 + 10; // Random size between 10-20px
       let ball = Bodies.circle(x, y, radius, {
           restitution: 0.7,
           friction: 0.05,
           density: 0.002,
           render: {
               fillStyle: ['#FFB6C1', '#A1C4FD', '#FFD700', '#98FB98'][Math.floor(Math.random() * 4)]
           }
       });
       World.add(world, ball);
   }

   // Keep clouds
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
   createClouds(8);

   // **Smooth Background Transition (Day to Night)**
   let time = 0;
   function updateBackground() {
       time += 0.0015;  // Smoother transition

       const r = Math.floor(120 + 80 * Math.sin(time));
       const g = Math.floor(180 + 50 * Math.sin(time + 2));
       const b = Math.floor(250 + 5 * Math.sin(time + 4));

       document.body.style.background = `rgb(${r}, ${g}, ${b})`;

       requestAnimationFrame(updateBackground);
   }
   updateBackground();

   // **Platforms with trampoline effects and random placements**
   const platformSettings = { isStatic: true, render: { fillStyle: '#ffffff88' } };
   const bouncyPlatformSettings = { isStatic: true, restitution: 50.2, render: { fillStyle: '#ffcc88' } };

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

   // **Trampoline spanning the entire width**
   const trampoline = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 40, window.innerWidth, 20, {
       isStatic: true,
       restitution: 80.3,
       render: { fillStyle: '#ff69b4' }
   });
   World.add(world, trampoline);

   // Side barriers
   const sideBarrierOptions = { isStatic: true, render: { fillStyle: '#ffffff00' } };
   World.add(world, [
       Bodies.rectangle(0, window.innerHeight / 2, 20, window.innerHeight, sideBarrierOptions),
       Bodies.rectangle(window.innerWidth, window.innerHeight / 2, 20, window.innerHeight, sideBarrierOptions)
   ]);

   // **Spawn More Balls on Load**
   for (let i = 0; i < 30; i++) {
       spawnBall(Math.random() * window.innerWidth, Math.random() * 200);
   }

   document.addEventListener("contextmenu", (event) => {
       event.preventDefault();
       spawnBall(event.clientX, event.clientY);
   });

   document.getElementById("playButton").addEventListener("click", () => {
       window.location.href = "src/html/sandbox.html";
   });