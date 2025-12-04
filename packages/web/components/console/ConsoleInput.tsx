'use client';

interface ConsoleInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea';
  className?: string;
}

export function ConsoleInput({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = '',
  type = 'text',
  className = '',
}: ConsoleInputProps) {
  const inputClasses =
    'w-full bg-black border border-green-500 text-green-500 px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50';

  return (
    <div className={className}>
      <label className="block text-green-500 font-mono text-sm mb-1">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`${inputClasses} min-h-[100px] text-xs`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
    </div>
  );
}

