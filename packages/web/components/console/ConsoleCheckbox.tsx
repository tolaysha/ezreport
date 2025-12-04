'use client';

interface ConsoleCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ConsoleCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
}: ConsoleCheckboxProps) {
  const id = `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 bg-black border border-green-500 text-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50"
      />
      <label htmlFor={id} className="text-green-500 font-mono text-sm">
        {label}
      </label>
    </div>
  );
}

