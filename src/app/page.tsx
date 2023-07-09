"use client";
import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  Bodies,
  Body,
  Engine,
  Render,
  World,
  Runner,
  Composites,
  Composite,
  Constraint,
  Mouse,
  MouseConstraint,
  Events,
  IMouseEvent,
  Common,
} from "matter-js";
import {
  TbPlus,
  TbBox,
  TbLine,
  TbSettings,
  TbShape3,
  TbZodiacAquarius,
  TbPointer,
  TbCircuitResistor,
  TbPlayerPause,
  TbPlayerPlay,
  TbChevronsDown,
  TbChevronDown,
} from "react-icons/tb";
import { Tooltip } from "@/components/Tooltip";
import { Listbox, Popover, RadioGroup, Transition } from "@headlessui/react";
import classNames from "classnames";

export default function Home() {
  const engine = useRef(Engine.create());

  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [constraints, setContraints] = useState({ width: 0, height: 0 });
  const [mouseConstraint, setMouseConstraint] =
    useState<MouseConstraint | null>(null);
  const [render, setRender] = useState<Render | null>();
  const [runner, setRunner] = useState<Runner | null>();
  const [currentPointer, setCurrentPointer] = useState<
    "default" | "object" | "line" | "ground" | "section" | "spring"
  >("default");

  const [openSettings, setOpenSettings] = useState(false);
  const [objects, setObjects] = useState<Body[]>([]);
  const [engineActive, setEngineActive] = useState(true);

  const [defaultObjectSettings, setDefaultObjectSettings] = useState({
    size: 25,
    mass: 100,
    density: 10,
    restitution: 0.5,
    friction: 0.001,
    frictionAir: 0,
  });

  const [moveFix, setMoveFix] = useState<"x" | "y" | null>(null);

  const [dragStartPosition, setDragStartPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dragEndPosition, setDragEndPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let currentEngine = engine.current;

    // mount

    let render = Render.create({
      element: boxRef.current!,
      engine: engine.current,
      canvas: canvasRef.current!,
      options: {
        wireframes: false,
        background: "transparent",
        showAngleIndicator: true,
        // showCollisions: true,
        showVelocity: true,
        // showPerformance: true,
        // showStats: true,
        showConvexHulls: true,
      },
    });

    const floor = Bodies.rectangle(0, 0, 0, 25, {
      isStatic: true,
      render: {
        fillStyle: "blue",
      },
    });

    // boundaries
    World.add(engine.current.world, [floor]);

    // run the engine
    let runner = Runner.run(engine.current);
    Render.run(render);

    var stack = Composites.stack(
      100,
      50,
      100,
      1,
      0,
      0,
      (x: number, y: number) => {
        return Bodies.circle(x, y, 5, {
          collisionFilter: {
            group: -1,
          },
          mass: 0,
          restitution: 0,
          friction: 0,
          frictionAir: 0,
          frictionStatic: 0,
          render: {
            visible: false,
          },
        });
      }
    );

    // create constraints between the bodies in the stack
    for (var i = 0; i < stack.bodies.length - 1; i++) {
      var bodyA = stack.bodies[i];
      var bodyB = stack.bodies[i + 1];
      var constraint = Constraint.create({
        bodyA: bodyA,
        bodyB: bodyB,
        stiffness: 0,
        damping: 0.1,
        render: {
          anchors: false,
          strokeStyle: "#2e2e2e",
          lineWidth: 1,
        },
      });
      Composite.add(stack, constraint);
    }

    // add the stack to the world
    // World.add(engine.current.world, stack);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine.current, {
      mouse: mouse,
      constraint: {
        stiffness: 0.5,
        render: {
          visible: false,
        },
      },
    });

    render.mouse = mouse;

    World.add(engine.current.world, mouseConstraint);

    setMouseConstraint(mouseConstraint);

    setContraints(boxRef.current!.getBoundingClientRect());
    setRunner(runner);
    setRender(render);

    const handleResize = () => {
      setContraints(boxRef.current!.getBoundingClientRect());
    };

    window.addEventListener("resize", handleResize);

    // unmount
    return () => {
      // destroy Matter
      Render.stop(render);
      World.clear(currentEngine.world, true);
      Engine.clear(currentEngine);
      // render.canvas.remove();
      // render.canvas = null
      // render.context = null
      render.textures = {};
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!mouseConstraint) return;

    const handleMousedown = (event: IMouseEvent<MouseConstraint>) => {
      const { x, y } = event.source.mouse.position;

      setDragStartPosition({ x, y });

      switch (currentPointer) {
        case "object":
          let { size, mass, density, restitution, friction, frictionAir } =
            defaultObjectSettings;
          let newObject = Bodies.circle(x, y, size, {
            mass,
            density,
            restitution,
            friction,
            frictionAir,
          });
          World.add(engine.current.world, newObject);
          break;
        case "ground":
          setIsDragging(true);
          console.log("down", x, y);
          break;
      }
    };

    const handleMouseup = (event: IMouseEvent<MouseConstraint>) => {
      const { x, y } = event.source.mouse.position;

      setDragEndPosition({ x, y });

      switch (currentPointer) {
        case "ground":
          setIsDragging(false);
          console.log("up", x, y);

          let newGround = Bodies.rectangle(
            (dragStartPosition!.x + x) / 2,
            (dragStartPosition!.y + y) / 2,
            Math.abs(dragStartPosition!.x - x),
            Math.abs(dragStartPosition!.y - y),
            {
              isStatic: true,
              friction: 0,
              restitution: 1,
              render: {
                fillStyle: "gray",
                strokeStyle: "gray",
                lineWidth: 1,
              },
            }
          );

          World.add(engine.current.world, newGround);

          break;
      }
    };

    const handleStartDrag = (event: any) => {
      console.log("startdrag", event);
    };

    const handleEndDrag = (event: any) => {
      console.log("enddrag", event);
    };

    Events.on(mouseConstraint, "mousedown", handleMousedown);
    Events.on(mouseConstraint, "mouseup", handleMouseup);
    Events.on(mouseConstraint, "startdrag", handleStartDrag);
    Events.on(mouseConstraint, "enddrag", handleEndDrag);

    return () => {
      Events.off(mouseConstraint, "mousedown", handleMousedown);
      Events.off(mouseConstraint, "mouseup", handleMouseup);
      Events.off(mouseConstraint, "startdrag", handleStartDrag);
      Events.off(mouseConstraint, "enddrag", handleEndDrag);
    };
  }, [
    currentPointer,
    mouseConstraint,
    defaultObjectSettings,
    dragStartPosition,
  ]);

  useEffect(() => {
    if (constraints && render) {
      let { width, height } = constraints;

      // Dynamically update canvas and bounds
      render.bounds.max.x = width;
      render.bounds.max.y = height;
      render.options.width = width;
      render.options.height = height;
      render.canvas.width = width;
      render.canvas.height = height;

      // Dynamically update floor
      const floor = engine.current.world.bodies[0];

      Body.setPosition(floor, {
        x: width / 2,
        y: height + 25 / 2,
      });

      Body.setVertices(floor, [
        { x: 0, y: height },
        { x: width, y: height },
        { x: width, y: height + 25 },
        { x: 0, y: height + 25 },
      ]);
    }
  }, [render, constraints]);

  return (
    <main className="h-screen w-screen flex flex-col">
      <div className="flex items-center px-5 gap-1 h-16 bg-gradient-to-r from-slate-200 to-neutral-200">
        <div className="text-xl px-3 uppercase font-semibold">Physika</div>
        <div className="border-r border-neutral-300 h-10 mx-2" />

        <RadioGroup
          value={currentPointer}
          className="flex items-center gap-1"
          onChange={(value) => setCurrentPointer(value)}
        >
          <Popover className="relative">
            {({ open }) => (
              <>
                <div className="flex items-center">
                  <Popover.Button>
                    <RadioGroup.Option value="default">
                      {({ checked }) => (
                        <Tooltip
                          label={
                            <div
                              className={classNames(
                                "w-24 px-2 py-1 bg-neutral-500 rounded-xl text-white text-sm"
                              )}
                            >
                              선택 및 이동
                            </div>
                          }
                        >
                          <div
                            className={classNames(
                              "px-2 py-2 rounded-xl transition-colors duration-200 text-2xl",
                              checked ? "bg-black/10" : "hover:bg-black/10"
                            )}
                          >
                            <TbPointer />
                          </div>
                        </Tooltip>
                      )}
                    </RadioGroup.Option>
                  </Popover.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute left-1/2 z-10 mt-3 w-80 max-w-md -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
                    <div className="px-3 py-2 bg-white border border-black/10 shadow-xl rounded-lg">
                      <div className="text-lg font-semibold">
                        선택 및 이동 설정
                      </div>
                      <hr className="my-2" />
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <div className="col-span-1">이동시 축 고정:</div>
                          <div className="col-span-1">
                            <Listbox value={moveFix} onChange={setMoveFix}>
                              <Listbox.Button className="bg-neutral-100 flex justify-between items-center gap-1 w-full px-3 py-2 rounded-lg">
                                <div className="flex-shrink-0">
                                  {moveFix === "x"
                                    ? "x축 고정"
                                    : moveFix === "y"
                                    ? "y축 고정"
                                    : "고정하지 않음"}
                                </div>
                                <TbChevronDown />
                              </Listbox.Button>
                              <div className="relative">
                                <Listbox.Options className="absolute mt-1 w-full bg-white rounded-lg shadow-lg">
                                  {[
                                    [null, "안 함"],
                                    ["x", "x축 고정"],
                                    ["y", "y축 고정"],
                                  ].map(([value, name]) => {
                                    return (
                                      <Listbox.Option
                                        key={value}
                                        value={value}
                                        className={({ active }) =>
                                          classNames(
                                            "px-3 py-1.5 cursor-pointer rounded-lg transition-colors duration-300",
                                            active ? "bg-black/5" : ""
                                          )
                                        }
                                      >
                                        {({ selected }) => (
                                          <span
                                            className={`block truncate ${
                                              selected
                                                ? "font-bold"
                                                : "font-normal"
                                            }`}
                                          >
                                            {name}
                                          </span>
                                        )}
                                      </Listbox.Option>
                                    );
                                  })}
                                </Listbox.Options>
                              </div>
                            </Listbox>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          <Popover className="relative">
            {({ open }) => (
              <>
                <div className="flex items-center">
                  <Popover.Button>
                    <RadioGroup.Option value="object">
                      {({ checked }) => (
                        <Tooltip
                          label={
                            <div
                              className={classNames(
                                "px-2 py-1 bg-neutral-500 rounded-xl text-white text-sm"
                              )}
                            >
                              물체
                            </div>
                          }
                        >
                          <div
                            className={classNames(
                              "px-2 py-2 rounded-xl transition-colors duration-200 text-2xl",
                              checked ? "bg-black/10" : "hover:bg-black/10"
                            )}
                          >
                            <TbBox />
                          </div>
                        </Tooltip>
                      )}
                    </RadioGroup.Option>
                  </Popover.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute left-1/2 z-10 mt-3 w-64 max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
                    <div className="px-3 py-2 bg-white border border-black/10 shadow-xl rounded-lg">
                      <div className="text-lg font-semibold">물체 설정</div>
                      <hr className="my-2" />
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <div className="col-span-1">크기:</div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min={0}
                              className="bg-neutral-100 rounded-lg px-3 py-2 outline-none w-full"
                              value={defaultObjectSettings.size}
                              onChange={(e) => {
                                setDefaultObjectSettings({
                                  ...defaultObjectSettings,
                                  size: Number(e.target.value),
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <div className="col-span-1">질량:</div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min={0}
                              className="bg-neutral-100 rounded-lg px-3 py-2 outline-none w-full"
                              value={defaultObjectSettings.mass}
                              onChange={(e) => {
                                setDefaultObjectSettings({
                                  ...defaultObjectSettings,
                                  mass: Number(e.target.value),
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <div className="col-span-1">밀도:</div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min={0}
                              className="bg-neutral-100 rounded-lg px-3 py-2 outline-none w-full"
                              value={defaultObjectSettings.density}
                              onChange={(e) => {
                                setDefaultObjectSettings({
                                  ...defaultObjectSettings,
                                  density: Number(e.target.value),
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <div className="col-span-1">반발 계수:</div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min={0}
                              max={1}
                              step={0.1}
                              className="bg-neutral-100 rounded-lg px-3 py-2 outline-none w-full"
                              value={defaultObjectSettings.restitution}
                              onChange={(e) => {
                                setDefaultObjectSettings({
                                  ...defaultObjectSettings,
                                  restitution: Number(e.target.value),
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <div className="col-span-1">기본 마찰 계수:</div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min={0}
                              max={1}
                              step={0.1}
                              className="bg-neutral-100 rounded-lg px-3 py-2 outline-none w-full"
                              value={defaultObjectSettings.friction}
                              onChange={(e) => {
                                setDefaultObjectSettings({
                                  ...defaultObjectSettings,
                                  friction: Number(e.target.value),
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <div className="col-span-1">공기 저항 계수:</div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min={0}
                              max={1}
                              step={0.1}
                              className="bg-neutral-100 rounded-lg px-3 py-2 outline-none w-full"
                              value={defaultObjectSettings.frictionAir}
                              onChange={(e) => {
                                setDefaultObjectSettings({
                                  ...defaultObjectSettings,
                                  frictionAir: Number(e.target.value),
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          {(
            [
              ["line", "실", TbLine],
              ["ground", "지면", TbShape3],
              ["section", "비보존 구간", TbZodiacAquarius],
              ["spring", "용수철", TbCircuitResistor],
            ] as unknown as [string, string, any][]
          ).map(([value, name, icon]) => (
            <RadioGroup.Option key={value} value={value}>
              {({ checked }) => (
                <Tooltip
                  label={
                    <div
                      className={classNames(
                        "px-2 py-1 bg-neutral-500 rounded-xl text-white text-sm"
                      )}
                    >
                      {name}
                    </div>
                  }
                >
                  <button
                    type="button"
                    className={classNames(
                      "px-2 py-2 rounded-xl transition-colors duration-200 text-2xl",
                      checked ? "bg-black/10" : "hover:bg-black/10"
                    )}
                  >
                    {React.createElement(icon)}
                  </button>
                </Tooltip>
              )}
            </RadioGroup.Option>
          ))}
        </RadioGroup>

        <div className="border-r border-neutral-300 h-4 mx-1" />
        <div className="ml-auto flex items-center gap-1">
          <Tooltip
            label={
              <div className="px-2 py-1 bg-neutral-500 rounded-xl text-white text-sm">
                {engineActive ? "중지" : "재개"}
              </div>
            }
          >
            <button
              type="button"
              className="px-2 py-2 hover:bg-black/10 rounded-xl transition-colors duration-200 text-2xl"
              onClick={() => {
                if (engineActive) {
                  Runner.stop(runner!);
                } else {
                  Runner.start(runner!, engine.current);
                }
                setEngineActive(!engineActive);
              }}
            >
              {engineActive ? <TbPlayerPause /> : <TbPlayerPlay />}
            </button>
          </Tooltip>
          <Tooltip
            label={
              <div className="px-2 py-1 bg-neutral-500 rounded-xl text-white text-sm">
                설정
              </div>
            }
          >
            <button
              type="button"
              className="px-2 py-2 hover:bg-black/10 rounded-xl transition-colors duration-200 text-2xl"
              onClick={() => {
                setOpenSettings(!openSettings);
              }}
            >
              <TbSettings />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="h-full w-full relative">
        <div
          ref={boxRef}
          className={classNames(
            "h-full w-full",
            ["object", "line", "ground", "spring"].includes(currentPointer) &&
              "cursor-crosshair"
          )}
        >
          <canvas ref={canvasRef} />
        </div>
        <Transition
          show={openSettings}
          className="h-full absolute z-40 w-1/4 right-0 inset-y-0"
        >
          <Transition.Child
            className="h-full flex"
            enter="transition ease-in-out duration-500 transform"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-500 transform"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <div className="flex-grow bg-black/10 backdrop-blur-xl shadow-lg px-5 py-4 m-4 rounded-xl">
              <div className="text-xl font-semibold">시뮬레이션 설정</div>
              <hr className="my-3 border-neutral-300" />
              <div className="grid grid-cols-2 items-center">
                <div className="col-span-1">중력:</div>
                <div className="col-span-1">
                  <input
                    type="number"
                    className="w-full bg-white outline-none rounded-xl px-3 py-2"
                    value={engine.current.gravity.scale}
                  />
                </div>
              </div>
            </div>
          </Transition.Child>
        </Transition>
      </div>
    </main>
  );
}
