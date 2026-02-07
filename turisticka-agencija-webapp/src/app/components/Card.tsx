"use client";

type CardProps = {
  title: string;
  description?: string;
  price?: number;
  badge?: string;
  badgeColor?: "blue" | "green" | "red" | "yellow" | "gray";
  children?: React.ReactNode;
  onClick?: () => void;
};

const badgeColors = {
  blue: "bg-[#FF9B54]/20 text-[#4F000B]",
  green: "bg-green-100 text-green-800",
  red: "bg-[#720026]/10 text-[#720026]",
  yellow: "bg-[#FF7F51]/20 text-[#4F000B]",
  gray: "bg-gray-100 text-gray-800",
};

export default function Card({
  title,
  description,
  price,
  badge,
  badgeColor = "blue",
  children,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3 h-full transition-all
        ${onClick ? "cursor-pointer hover:shadow-md hover:border-[#CE4257]" : ""}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {badge && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>

      {description && (
        <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
      )}

      {price !== undefined && (
        <p className="text-xl font-bold text-[#CE4257]">{price.toFixed(2)} €</p>
      )}

      {children && <div className="mt-auto pt-2">{children}</div>}
    </div>
  );
}