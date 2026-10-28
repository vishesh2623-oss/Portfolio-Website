/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Reveal from "../components/Reveal";

const certificateFolders = [
  {
    title: "Google AI Specialization",
    specialization: "/assets/projects/google ai.jpg",
    logo: "/assets/logos/google.svg",
    certificates: [
      "/assets/projects/ai responsibly.jpg",
      "/assets/projects/art of prompt.jpg",
      "/assets/projects/google ai intro.jpg",
      "/assets/projects/ai curve.jpg",
      "/assets/projects/max productivity.jpg",
    ],
  },
  {
    title: "SOLIDWORKS 3D CAD",
    specialization: "/assets/projects/so1.jpg",
    logo: "/assets/logos/soildworkslogo.svg",
    certificates: [
      "/assets/projects/sketching.jpg",
      "/assets/projects/so2.jpg",
      "/assets/projects/so3.jpg",
      "/assets/projects/so4.jpg",
      "/assets/projects/so5.jpg",
    ],
  },
  {
    title: "CATIA Specialization",
    specialization: "/assets/projects/catia4.jpg",
    logo: "/assets/logos/catialogo.svg",
    certificates: [
      "/assets/projects/catia2.jpg",
      "/assets/projects/catia3.jpg",
      "/assets/projects/catia1.jpg",
      "/assets/projects/catia5.jpg",
      "/assets/projects/catia6.jpg",
      "/assets/projects/catia7.jpg",
      "/assets/projects/catia8.jpg",
    ],
  },
];

const otherCertificates = [
  "/assets/projects/ai everyone.jpg",
  "/assets/projects/ai data analysis.jpg",
  "/assets/projects/intro to python.jpg",
  "/assets/projects/microsoft azure.jpg",
  "/assets/projects/basics python.jpg",
  "/assets/projects/ibm.jpg",
  "/assets/projects/nptel.jpg",
  "/assets/projects/claude.jpg",
  "/assets/projects/drug-pledge.jpg",
  "/assets/projects/janatics.jpg",
  "/assets/projects/auton.jpg",
];

const achievements = ["/assets/projects/psg.jpg", "/assets/projects/ideafest.png"];
const internships = ["/assets/projects/intern.jpg"];

const CertificateGrid = ({ title, images }) => (
  <div className="mb-20">
    <Reveal
      as="h2"
      className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-10 bg-gradient-to-r from-green-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]"
    >
      {title}
    </Reveal>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
      {images.map((src, index) => (
        <Reveal
          key={`${title}-${index}`}
          className="group overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80 shadow-[0_0_20px_rgba(0,0,0,0.6)] hover:border-green-500/30 transition-all duration-300"
          delay={Math.min(index * 0.05, 0.3)}
        >
          <img
            src={src}
            alt={`${title} document ${index + 1}`}
            className="w-full h-auto object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
        </Reveal>
      ))}
    </div>
  </div>
);

const CertificateFolder = ({ folder, onOpen, index }) => (
  <Reveal delay={index * 0.08}>
    <button
      type="button"
      onClick={(event) => onOpen(folder, event.currentTarget)}
      className="group flex min-h-40 w-full flex-col items-start justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-storm/80 to-indigo/80 p-6 text-left shadow-[0_0_20px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-sand/50 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
      aria-haspopup="dialog"
    >
      <div className="flex w-full items-start justify-between">
        <img
          src={folder.logo}
          alt=""
          aria-hidden="true"
          className="h-10 w-12 object-contain transition-transform duration-300 group-hover:-translate-y-1"
        />
        <span className="text-sm text-neutral-400">
          {folder.certificates.length + 1} certificates
        </span>
      </div>
      <span className="mt-6 text-lg font-semibold text-neutral-100">
        {folder.title}
      </span>
    </button>
  </Reveal>
);

const CertificateModal = ({ folder, onClose, shouldReduceMotion }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const closeButtonRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-folder-title"
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-midnight to-navy shadow-2xl"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.99 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <h3
            id="certificate-folder-title"
            className="pr-4 text-xl font-bold text-white sm:text-2xl"
          >
            {folder.title}
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${folder.title}`}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-neutral-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand"
          >
            <span aria-hidden="true" className="text-2xl leading-none">×</span>
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <section aria-label="Specialization certificate" className="min-w-0">
            <h4 className="mb-3 text-base font-semibold text-neutral-100">
              Specialization Certificate
            </h4>
            <div className="flex min-h-56 items-center justify-center rounded-xl border border-white/10 bg-black/25 p-2 sm:min-h-[25rem]">
              <img
                src={folder.specialization}
                alt={`${folder.title} specialization certificate`}
                className="max-h-[55vh] w-full rounded-lg object-contain"
              />
            </div>
          </section>

          <section aria-label="Individual certificates" className="min-w-0">
            <h4 className="mb-3 text-base font-semibold text-neutral-100">
              Individual Certificates
            </h4>
            <div className="space-y-2">
              {folder.certificates.map((src, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <div
                    key={src}
                    className="overflow-hidden rounded-xl border border-white/10 bg-black/20"
                  >
                    <button
                      type="button"
                      aria-expanded={isSelected}
                      aria-controls={`certificate-preview-${index}`}
                      onClick={() =>
                        setSelectedIndex(isSelected ? null : index)
                      }
                      className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-neutral-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sand"
                    >
                      <span className="text-lg text-sand" aria-hidden="true">
                        →
                      </span>
                      <span className="flex-1">Certificate {index + 1}</span>
                      <span className="text-sm text-neutral-500" aria-hidden="true">
                        {isSelected ? "−" : "+"}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isSelected && (
                        <motion.div
                          id={`certificate-preview-${index}`}
                          initial={
                            shouldReduceMotion
                              ? false
                              : { opacity: 0, height: 0 }
                          }
                          animate={{ opacity: 1, height: "auto" }}
                          exit={
                            shouldReduceMotion
                              ? undefined
                              : { opacity: 0, height: 0 }
                          }
                          transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
                          className="overflow-hidden border-t border-white/10 p-3"
                        >
                          <img
                            src={src}
                            alt={`${folder.title} certificate ${index + 1}`}
                            className="max-h-[50vh] w-full rounded-lg object-contain"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Credentials = () => {
  const [openFolder, setOpenFolder] = useState(null);
  const triggerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!openFolder) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openFolder]);

  const openCertificateFolder = (folder, trigger) => {
    triggerRef.current = trigger;
    setOpenFolder(folder);
  };

  const closeCertificateFolder = () => {
    setOpenFolder(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <section className="max-w-7xl mx-auto py-20" id="credentials">
      <div className="mb-20">
        <Reveal
          as="h2"
          className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-10 bg-gradient-to-r from-green-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]"
        >
          Certificates
        </Reveal>
        <div className="grid grid-cols-1 gap-5 px-4 md:grid-cols-2 lg:grid-cols-3">
          {certificateFolders.map((folder, index) => (
            <CertificateFolder
              key={folder.title}
              folder={folder}
              index={index}
              onOpen={openCertificateFolder}
            />
          ))}
        </div>
      </div>

      <CertificateGrid title="Other Certificates" images={otherCertificates} />
      <CertificateGrid title="Achievements & Hackathons" images={achievements} />
      <CertificateGrid title="Internship Experience" images={internships} />

      <AnimatePresence>
        {openFolder && (
          <CertificateModal
            key={openFolder.title}
            folder={openFolder}
            onClose={closeCertificateFolder}
            shouldReduceMotion={shouldReduceMotion}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default Credentials;
