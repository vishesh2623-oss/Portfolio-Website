import { useEffect, useState } from "react";
import Navbar from "./sections/Navbar";
import HomePage from './sections/Home';
import About from "./sections/About";
import Projects from "./sections/Projects";
import Credentials from "./sections/Credentials";
import Experiences from "./sections/Experiences";
import Testimonial from "./sections/Testimonial";
import Contact from "./sections/Contact";
import Footer from "./sections/Footer";
import VisitorCounter from "./sections/VisitorCounter";
import { myProjects } from "./constants";

const getProjectFromLocation = () => {
  const projectId = new URLSearchParams(window.location.search).get("project");
  return myProjects.find((project) => String(project.id) === projectId) ?? null;
};

const App = () => {
  const [selectedProject, setSelectedProject] = useState(getProjectFromLocation);

  useEffect(() => {
    const syncProjectFromLocation = () => {
      setSelectedProject(getProjectFromLocation());
    };

    window.addEventListener("popstate", syncProjectFromLocation);
    if (getProjectFromLocation() && !window.location.hash) {
      document.getElementById("projects")?.scrollIntoView();
    }
    return () => window.removeEventListener("popstate", syncProjectFromLocation);
  }, []);

  const openProject = (project) => {
    const url = new URL(window.location.href);
    url.searchParams.set("project", String(project.id));
    window.history.pushState(
      { projectDetailId: project.id },
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
    setSelectedProject(project);
  };

  const backToProjects = () => {
    if (window.history.state?.projectDetailId === selectedProject?.id) {
      window.history.back();
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
    setSelectedProject(null);
  };

  return (
    <div className="container mx-auto max-w-7xl">
      <Navbar />
      <section id="home">
        <HomePage />
      </section>

      <section id="about">
        <About />
      </section>

      {/* 1. Projects Section MUST BE FIRST */}
      <section id="projects">
        <Projects
          selectedProject={selectedProject}
          onSelectProject={openProject}
          onBackToProjects={backToProjects}
        />
      </section>

      {/* 2. Credentials Section MUST BE SECOND */}
      <section id="credentials">
        <Credentials />
      </section>

      <section id="work">
        <Experiences />
      </section>

      <Testimonial />

      <section id="contact">
        <Contact />
      </section>

      <VisitorCounter />
      <Footer />
    </div>
  );
};

export default App;