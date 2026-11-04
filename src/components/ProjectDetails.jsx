/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const isSketchfabUrl = (value) => {
  if (!value) return false;

  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "sketchfab.com" || hostname.endsWith(".sketchfab.com");
  } catch {
    return false;
  }
};

const getSketchfabModelId = (...urls) => {
  for (const value of urls) {
    if (!isSketchfabUrl(value)) continue;

    const pathname = new URL(value).pathname;
    const directId = pathname.match(/(?:^|\/)([a-f\d]{32})(?:\/embed)?\/?$/i);
    const slugId = pathname.match(/\/3d-models\/[^/]*-([a-f\d]{32})(?:\/|$)/i);
    const modelId = directId?.[1] ?? slugId?.[1];

    if (modelId) return modelId;
  }

  return null;
};

const ProjectDetails = ({ project, onBack }) => {
  const shouldReduceMotion = useReducedMotion();
  const {
    title,
    description,
    subDescription = [],
    image,
    tags = [],
    href,
    cadHref,
  } = project;
  const modelId = getSketchfabModelId(cadHref, href);
  const sketchfabLink = [cadHref, href].find(isSketchfabUrl);
  const projectLink = href && !isSketchfabUrl(href) ? href : null;
  const [viewerState, setViewerState] = useState(modelId ? "loading" : "fallback");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!modelId || viewerState !== "loading") return undefined;

    const timeoutId = window.setTimeout(() => {
      setViewerState("fallback");
    }, 20000);

    return () => window.clearTimeout(timeoutId);
  }, [modelId, reloadKey, viewerState]);

  const retryModel = () => {
    setViewerState("loading");
    setReloadKey((key) => key + 1);
  };

  return (
    <motion.div
      className="min-h-[70vh] py-8 md:py-12"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300 transition hover:border-aqua/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua/50"
      >
        <span aria-hidden="true">←</span>
        Back to Projects
      </button>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.8fr)] lg:gap-10">
        <section
          aria-label="Interactive 3D model"
          className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-storm/70 to-midnight shadow-xl shadow-black/20"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
              Interactive model
            </p>
            {modelId && viewerState !== "fallback" && image && (
              <button
                type="button"
                onClick={() => setViewerState("fallback")}
                className="text-xs text-neutral-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua/50"
              >
                View project image
              </button>
            )}
            {modelId && viewerState === "fallback" && (
              <button
                type="button"
                onClick={retryModel}
                className="text-xs text-aqua transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua/50"
              >
                Retry 3D model
              </button>
            )}
          </div>

          <div className="relative aspect-[4/3] w-full bg-primary sm:aspect-video">
            {modelId && viewerState !== "fallback" ? (
              <>
                <iframe
                  key={reloadKey}
                  title={`${title.trim()} interactive 3D model`}
                  src={`https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_theme=dark&ui_controls=1&ui_infos=0`}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => setViewerState("loaded")}
                  onError={() => setViewerState("fallback")}
                />
                {viewerState === "loading" && (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-primary"
                    role="status"
                  >
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-aqua" />
                    <span className="text-sm text-neutral-400">Loading 3D model...</span>
                  </div>
                )}
              </>
            ) : image ? (
              <div className="absolute inset-0">
                <img
                  src={image}
                  alt={`${title.trim()} project preview`}
                  className="h-full w-full object-contain p-4 pb-12"
                />
                <p className="absolute inset-x-0 bottom-0 bg-primary/80 px-4 py-3 text-center text-sm text-neutral-400">
                  {modelId
                    ? "The interactive model is unavailable. Showing the project image instead."
                    : "No 3D model is linked for this project. Showing the project image instead."}
                </p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-neutral-400">
                {modelId
                  ? "The interactive model is unavailable."
                  : "No 3D model or project image is available."}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-7">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-aqua">
            Project overview
          </p>
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
            {title.trim()}
          </h1>
          <p className="mt-4 leading-relaxed text-neutral-300">{description}</p>

          {tags.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
                Category &amp; tools
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-sand"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {subDescription.length > 0 && (
            <div className="mt-7">
              <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
                Engineering highlights
              </h2>
              <ul className="mt-3 space-y-3">
                {subDescription.map((highlight, index) => (
                  <li
                    key={`${project.id}-${index}`}
                    className="flex gap-3 text-sm leading-relaxed text-neutral-300"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(projectLink || sketchfabLink) && (
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-5">
              {projectLink && (
                <a
                  href={projectLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-aqua transition hover:text-white"
                >
                  Visit project ↗
                </a>
              )}
              {sketchfabLink && (
                <a
                  href={sketchfabLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-neutral-400 transition hover:text-white"
                >
                  Open on Sketchfab ↗
                </a>
              )}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
};

export default ProjectDetails;
