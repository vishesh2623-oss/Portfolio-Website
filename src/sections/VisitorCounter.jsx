import { useEffect, useRef, useState } from "react";

const VisitorCounter = () => {
  const [count, setCount] = useState(null);
  const [hasError, setHasError] = useState(false);
  const hasCounted = useRef(false);

  useEffect(() => {
    if (hasCounted.current) return;
    hasCounted.current = true;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const incrementVisit = async () => {
      try {
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Supabase visitor counter configuration is missing.");
        }

        const response = await fetch(
          `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/increment_site_visits`,
          {
            method: "POST",
            headers: {
              apikey: supabaseKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          }
        );

        if (!response.ok) {
          throw new Error(`Visitor counter request failed (${response.status}).`);
        }

        const total = await response.json();
        if (!Number.isSafeInteger(total) || total < 1) {
          throw new Error("The visitor counter returned an invalid total.");
        }

        setCount(total);
      } catch (error) {
        console.error("Unable to update the website visitor counter.", error);
        setHasError(true);
      }
    };

    incrementVisit();
  }, []);

  return (
    <section
      aria-label="Website visitor counter"
      className="w-full px-5 py-8 text-center sm:py-10"
    >
      <p className="text-xs tracking-[0.22em] text-neutral-400">
        TOTAL WEBSITE VISITS
      </p>
      <p
        aria-live="polite"
        aria-atomic="true"
        className="mt-2 text-3xl font-bold text-white sm:text-4xl"
      >
        {count !== null ? (
          <span key={count} className="visitor-count-pop">
            {count.toLocaleString()}
          </span>
        ) : hasError ? (
          <span className="text-sm font-normal text-neutral-400">
            Temporarily unavailable
          </span>
        ) : (
          <span className="text-sm font-normal text-neutral-400">
            Loading...
          </span>
        )}
      </p>
    </section>
  );
};

export default VisitorCounter;
