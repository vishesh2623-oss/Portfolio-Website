import { Frameworks } from "../components/Frameworks";
import Reveal from "../components/Reveal";
import EngineeringUniverse from "../components/EngineeringUniverse";
import EngineeringToolkit from "../components/EngineeringToolkit";
import CopyEmailButton from "../components/CopyEmailButton";

const About = () => {

  return (
    <section className="c-space section-spacing" id="about">
      <Reveal as="h2" className="text-heading">About Me</Reveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[minmax(18rem,auto)] mt-12">
        <Reveal className="flex items-start grid-default-color grid-1 relative overflow-hidden bg-black/80 rounded-2xl" whileHover={{ y: -4 }}>
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
                className="inline-block px-6 py-2.5 bg-[#4ade80]/10 hover:bg-[#4ade80] text-[#4ade80] hover:text-black font-medium text-sm rounded-xl border border-[#4ade80]/30 hover:border-[#4ade80] backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(74,222,128,0.15)] hover:shadow-[0_0_25px_rgba(74,222,80,0.4)] cursor-pointer text-center"
              >
                Download Resume
              </a>
            </div>
          </div>
          <div className="absolute inset-x-0 pointer-events-none -bottom-4 h-1/2 sm:h-1/3 bg-gradient-to-t from-indigo" />
        </Reveal>

        {/* Grid 2: My Engineering Toolkit */}
        <Reveal className="grid-default-color grid-2" delay={0.08} whileHover={{ y: -4 }}>
          <EngineeringToolkit />
        </Reveal>

        {/* Grid 3: Engineering Universe (3D gearbox) */}
        <Reveal className="grid-black-color grid-3 relative min-h-[34rem] overflow-hidden lg:min-h-0" delay={0.16} whileHover={{ y: -4 }}>
          <EngineeringUniverse />
          <div className="z-10 absolute top-0 left-0 w-full p-4 pointer-events-none lg:w-[55%]">
            <p className="headtext mt-0 mb-2 break-words text-[clamp(1rem,5vw,1.25rem)] leading-tight lg:mt-2 lg:mb-2 lg:text-xl">
              ENGINEERING UNIVERSE
            </p>
            <p className="subtext font-semibold text-neutral-200">
              Where Mechanical Design Meets Innovation
            </p>
            <p className="subtext mt-1">
              Exploring mechanisms, engineering systems and the art of
              transforming ideas into functional designs.
            </p>
          </div>
        </Reveal>

        {/* Grid 4: Contact / CTA */}
        <Reveal className="grid-special-color grid-4" delay={0.08} whileHover={{ y: -4 }}>
          <div className="flex flex-col items-center justify-center gap-4 size-full">
            <p className="text-center headtext">
              Do you want to start a project together?
            </p>
            <CopyEmailButton />
          </div>
        </Reveal>

        {/* Grid 5: Tech Stack */}
        <Reveal className="grid-default-color grid-5 relative overflow-hidden" delay={0.16} whileHover={{ y: -4 }}>
          <div className="z-10 w-[50%]">
            <p className="headtext">Engineering Software & Tools</p>
            <p className="subtext">
             I specialize in 3D CAD modeling and physical simulations using SolidWorks, Fusion 360 and Solid Edge.
            </p>
          </div>
          <div className="absolute inset-y-0 md:inset-y-9 w-full h-full start-[50%] md:scale-125">
            <Frameworks />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default About;