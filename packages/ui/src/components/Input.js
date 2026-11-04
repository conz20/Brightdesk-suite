import { theme } from "../theme.js";

export const Input = ({ placeholder, value, onChange }) => {
  return {
    type: "input",
    placeholder,
    value,
    style: {
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily,
      border: `1px solid ${theme.colors.muted}`,
      borderRadius: "4px",
      padding: "8px"
    },
    onChange
  };
};
