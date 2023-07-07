"use client";
import { useEffect, useRef } from "react";
import { Bodies, Engine, Render, World, Runner } from "matter-js";

export default function Home() {
  const scene = useRef<HTMLDivElement>(null);
  const engine = useRef(Engine.create());
  const render = useRef<Render | null>(null);

  useEffect(() => {
    let currentEngine = engine.current;

    // mount
    const cw = scene.current!.clientWidth;
    const ch = scene.current!.clientHeight;

    render.current = Render.create({
      element: scene.current!,
      engine: engine.current,
      options: {
        width: cw,
        height: ch,
        wireframes: false,
        background: "transparent",
      },
    });

    let currentRender = render.current;

    // boundaries
    World.add(engine.current.world, [
      Bodies.rectangle(cw / 2, -10, cw, 20, { isStatic: true }),
      Bodies.rectangle(-10, ch / 2, 20, ch, { isStatic: true }),
      Bodies.rectangle(cw / 2, ch + 10, cw, 20, { isStatic: true }),
      Bodies.rectangle(cw + 10, ch / 2, 20, ch, { isStatic: true }),
    ]);

    // run the engine
    Runner.run(engine.current);
    Render.run(render.current);

    const ball = Bodies.circle(500, 500, 25, {
      mass: 10,
      restitution: 0,
      friction: 0,
      render: {
        fillStyle: "#2e2e2e",
      },
    });
    World.add(engine.current.world, [ball]);

    // unmount
    return () => {
      // destroy Matter
      Render.stop(currentRender!);
      World.clear(currentEngine.world, true);
      Engine.clear(currentEngine);
      currentRender!.canvas.remove();
      // render.canvas = null
      // render.context = null
      currentRender!.textures = {};
    };
  }, []);

  return (
    <main className="h-screen w-screen flex flex-col">
      <div className="flex gap-3 h-16 bg-gradient-to-r from-slate-200 to-neutral-200">
        <div>Physika</div>
      </div>
      <div ref={scene} className="h-full w-full" />
    </main>
  );
}
