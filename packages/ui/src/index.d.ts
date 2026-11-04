export interface Theme {
  colors: Record<string, string>;
  typography: Record<string, string>;
}

export interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}

export interface CardProps {
  title: string;
  content: string;
}

export interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
}

export const theme: Theme;
export function Button(props: ButtonProps): object;
export function Card(props: CardProps): object;
export function Input(props: InputProps): object;
