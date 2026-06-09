/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Single rigid palette — three colors plus two derived neutrals.
      // Everything is sourced from CSS variables so the entire app can be
      // re-themed by editing one file.
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        ink: {
          DEFAULT: "var(--color-ink)",
          soft: "var(--color-ink-soft)",
          faint: "var(--color-ink-faint)",
          // Legacy scale aliases. They keep any not-yet-migrated file inside
          // the new palette instead of bleeding old slate tones onto the
          // canvas. All ten steps collapse onto the three real values.
          50: "var(--color-bg)",
          100: "var(--color-bg)",
          200: "var(--color-line-strong)",
          300: "var(--color-line-strong)",
          400: "var(--color-ink-faint)",
          500: "var(--color-ink-soft)",
          600: "var(--color-ink-soft)",
          700: "var(--color-ink)",
          800: "var(--color-ink)",
          900: "var(--color-ink)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          soft: "var(--color-accent-soft)",
        },
        male: "var(--color-male)",
        female: "var(--color-female)",
        line: {
          DEFAULT: "var(--color-line)",
          strong: "var(--color-line-strong)",
        },
        onInk: "var(--color-ink-on-ink)",
      },
      fontFamily: {
        sans: [
          "Inter Tight",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Fraunces", "Cormorant Garamond", "Georgia", "serif"],
      },
      // Deliberate 8pt rhythm tokens. Used as `py-section`, `px-gutter`, etc.
      spacing: {
        stack: "1.5rem", // 24px
        gutter: "2rem", // 32px
        section: "4rem", // 64px
        "section-lg": "6rem", // 96px
      },
      borderRadius: {
        DEFAULT: "0px",
        none: "0px",
        sm: "2px",
        md: "2px",
        lg: "2px",
        xl: "2px",
        "2xl": "2px",
        full: "9999px",
      },
      boxShadow: {
        DEFAULT: "none",
        sm: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
      },
      letterSpacing: {
        tight: "-0.01em",
        tighter: "-0.02em",
        eyebrow: "0.22em",
      },
      maxWidth: {
        prose: "62ch",
      },
      // Editorial motion vocabulary. Short distances, short durations.
      // Every component reaches for these utilities so the app's motion
      // language stays as disciplined as the visual one.
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 400ms ease-out both",
        "fade-in-up": "fadeInUp 500ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "scale-in": "scaleIn 200ms ease-out both",
      },
      transitionTimingFunction: {
        // Sourced from `--ease-smooth` in styles/index.css so the easing
        // token lives alongside the rest of the design tokens.
        smooth: "var(--ease-smooth)",
      },
    },
  },
  plugins: [],
};
