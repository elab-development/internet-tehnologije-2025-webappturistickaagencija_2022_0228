"use client";

type InputFieldProps = {
  label: string;
  type?: "text" | "email" | "password" | "number" | "date";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  min?: string;
};

export default function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  error,
  min,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-[#CE4257] ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 placeholder-gray-400 outline-none transition-colors
          ${error ? "border-[#CE4257] focus:border-[#CE4257]" : "border-gray-300 focus:border-[#FF7F51]"}
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
      />
      {error && <p className="text-sm text-[#CE4257]">{error}</p>}
    </div>
  );
}