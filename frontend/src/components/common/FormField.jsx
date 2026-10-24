import React from 'react';

export default function FormField({
  label,
  id,
  error,
  required = false,
  helpText,
  children
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {children}

      {helpText && !error && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}

      {error && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
          <span>•</span> {error}
        </p>
      )}
    </div>
  );
}
