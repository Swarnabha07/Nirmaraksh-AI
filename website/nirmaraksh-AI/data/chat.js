// Static placeholder content for the /chat UI (taken from the Figma design).
// Replace chatProfile with the real signed-in user once authentication exists.
export const chatNav = [
  { icon: "home", label: "Main" },
  { icon: "search", label: "Research" },
  { icon: "tools", label: "Builder" },
];

export const chatProfile = { name: "Snehasish Saha", plan: "Free" };

export const chatGreeting = ["Hello! I'm Nirmaraksh.", "How can I help you today?"];
export const chatCapabilities = ["I can research, analyze, build,", "and automate tasks for you."];

// Max length of a user-renamed chat title.
export const CHAT_TITLE_MAX = 60;

// Upgrade popup copy (opened from the + button). No prices: billing is not implemented.
export const upgradeIntro = "Everything in Free and:";
export const upgradeFeatures = [
  "Claude Code directly in your codebase",
  "Power through tasks with Cowork",
  "Build and prototype with Claude Design",
  "Higher usage limits",
  "Access to more Claude models",
];
