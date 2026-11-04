import { theme } from "../theme.js";

export const Card = ({ title, content }) => {
  return {
    type: "card",
    title,
    content,
    style: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily,
      borderRadius: "8px",
      padding: "16px"
    }
  };
};
