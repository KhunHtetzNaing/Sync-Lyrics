import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation";
  
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-gray-950 shadow-lg shadow-emerald-500/20 focus:ring-emerald-500 border border-transparent font-bold",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 focus:ring-zinc-500",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 focus:ring-red-500",
    ghost: "bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white focus:ring-zinc-500",
    icon: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/10 rounded-full aspect-square p-0"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  // Override padding for icon variant
  const finalSize = variant === 'icon' ? (size === 'sm' ? 'h-8 w-8' : 'h-10 w-10') : sizes[size];

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${finalSize} ${className}`}
      {...props}
    >
      {icon && <span className={children ? "mr-2 -ml-0.5" : ""}>{icon}</span>}
      {children}
    </button>
  );
};