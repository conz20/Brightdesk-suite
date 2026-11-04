import { theme } from "../theme.js";

export const Button = ({ label, variant = "primary", onClick }) => {
  const bg = variant === "primary" ? theme.colors.primary : theme.colors.surface;
  return {
    type: "button",
    label,
    style: {
      backgroundColor: bg,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily,
      padding: "8px 16px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer"
    },
    onClick
  };
};
