"use client";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const base = "rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#CE4257] text-white hover:bg-[#720026]",
    secondary: "bg-[#4F000B] text-white hover:bg-[#720026]",
    danger: "bg-[#720026] text-white hover:bg-[#4F000B]",
    success: "bg-green-600 text-white hover:bg-green-700",
    outline: "border-2 border-[#CE4257] text-[#CE4257] hover:bg-[#CE4257]/10",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-7 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}