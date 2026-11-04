import { theme } from "@brightdesk/ui";

const state = {
  tasks: ["Design Suite Architecture", "Implement UI Shared Package"],
  theme: theme.colors.primary
};

console.log("Brightdesk To Do — Ready with theme:", state.theme);
console.log("Current Tasks:", state.tasks);
