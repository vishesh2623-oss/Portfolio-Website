import { useRef } from "react";
import Card from "../components/Card";
import { Globe } from "../components/globe";
import CopyEmailButton from "../components/CopyEmailButton";
import { Frameworks } from "../components/Frameworks";

const About = () => {
  const grid2Container = useRef();

  return (
    <section className="c-space section-spacing" id="about">
      <h2 className="text-heading">About Me</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[minmax(18rem,auto)] mt-12">
<div className="flex items-start grid-default-color grid-1 relative overflow-hidden bg-black/80 rounded-2xl">
          <div className="z-10 w-full p-2 sm:p-4">
            <p className="headtext text-center text-2xl font-semibold md:text-3xl">
              Hi, I&apos;m Vishesh R S
            </p>
            <div className="space-y-3 text-sm font-semibold leading-relaxed text-neutral-100 md:text-base">
              <p>
                As a B.E. Mechanical Engineering student at SKCET I am
                passionate about mechanical design, CAD modelling, product
                development, and engineering innovation.
              </p>
              <p>
                My interests lie in transforming ideas into practical
                engineering solutions through 3D modelling, component
                integration, and prototype development. I am developing my
                skills in SOLIDWORKS while exploring how electronics, sensors,
                and emerging technologies can enhance mechanical systems.
              </p>
              <p>
                One of my key projects is a Smart Water Purification and Quality
                Monitoring System designed for rural and mining-affected areas.
                Through this project, I am exploring the integration of
                mechanical design, water filtration, and real-time quality
                monitoring into a portable system.
              </p>
              <p>
                I believe engineering is not just about designing components,
                but about understanding problems, evaluating solutions, and
                continuously improving designs through testing and iteration.
              </p>
            </div>

            <div className="mt-8">
              <a
                href="/assets/projects/final_resume.pdf"
                download="final_resume.pdf"
                className="inline-block px-6 py-2.5 bg-[#4ade80]/10 hover:bg-[#4ade80] text-[#4ade80] hover:text-black font-medium text-sm rounded-xl border border-[#4ade80]/30 hover:border-[#4ade80] backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(74,222,128,0.15)] hover:shadow-[0_0_25px_rgba(74,222,128,0.4)] cursor-pointer text-center"
              >
                Download Resume
              </a>
            </div>
          </div>

          <div className="absolute inset-x-0 pointer-events-none -bottom-4 h-1/2 sm:h-1/3 bg-gradient-to-t from-indigo" />
        </div>

        {/* Grid 2: Engineering Software Cards */}
        <div className="grid-default-color grid-2">
          <div
            ref={grid2Container}
            className="flex items-center justify-center w-full h-full relative"
          >
            <p className="flex items-end text-5xl text-gray-500">
              My Passion for Engineering
            </p>
            <Card
              style={{ rotate: "75deg", top: "30%", left: "20%" }}
              text="SOLIDWORKS"
              containerRef={grid2Container}
            />
            <Card
              style={{ rotate: "-30deg", top: "60%", left: "45%" }}
              text="SOLID EDGE"
              containerRef={grid2Container}

            />
            <Card
              style={{ rotate: "-45deg", top: "70%", left: "25%" }}
              image="assets/logos/soildworks.png"
              containerRef={grid2Container}
            />
            <Card
              style={{ rotate: "-45deg", top: "5%", left: "10%" }}
              image="assets/logos/soildedge.webp"
              containerRef={grid2Container}
            />
          </div>
        </div>

        {/* Grid 3: Location / Globe */}
        <div className="grid-black-color grid-3 relative overflow-hidden">
          <div className="z-10 w-[50%]">
            <p className="headtext">Time Zone</p>
            <p className="subtext">
              I am an Indian and I am highly open to remote design work,
              internships, and collaborative engineering projects worldwide.
            </p>
          </div>
          <figure className="absolute left-[30%] top-[10%]">
            <Globe />
          </figure>
        </div>

        {/* Grid 4: Contact / CTA */}
        <div className="grid-special-color grid-4">
          <div className="flex flex-col items-center justify-center gap-4 size-full">
            <p className="text-center headtext">
              Do you want to start a project together?
            </p>
            <CopyEmailButton />
          </div>
        </div>

        {/* Grid 5: Tech Stack */}
        <div className="grid-default-color grid-5 relative overflow-hidden">
          <div className="z-10 w-[50%]">
            <p className="headtext">Engineering Software & Tools</p>
            <p className="subtext">
             I specialize in 3D CAD modeling and physical simulations using SolidWorks, Fusion 360 and Solid Edge.
            </p>
          </div>
          <div className="absolute inset-y-0 md:inset-y-9 w-full h-full start-[50%] md:scale-125">
            <Frameworks />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;