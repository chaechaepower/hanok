import React from 'react';

type Props = {
  variant?: 'outline' | 'yellowOutline' | 'white' | 'black' | 'red' | 'yellow' | 'navLogin' | 'navSignup';
  size?: 'large' | 'small' | 'responsive';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const base =
  'w-full rounded-[36px] flex items-center justify-center whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  large: 'h-[60px] text-[22px] md:h-[46px] md:text-[18px]',
  small: 'h-[36px] text-[16px] md:h-[32px] md:text-[14px]',
  responsive: 'h-[36px] text-[16px] md:h-[42px] md:text-[14px] min-[960px]:h-[60px] min-[960px]:text-[22px]',
};

const variantClass: Record<NonNullable<Props['variant']>, string> = {
  outline: 'bg-transparent text-neutral-100 shadow-[0_0_0_1px_var(--color-neutral-500)_inset] hover:bg-neutral-900',
  yellowOutline: 'bg-transparent text-gold-light shadow-[0_0_0_1px_var(--color-gold)_inset] hover:bg-neutral-900',
  white: 'bg-neutral-100 text-background hover:bg-neutral-200',
  black: 'bg-background text-neutral-100 hover:bg-neutral-900',
  yellow: 'bg-gold text-background hover:bg-gold-dark',
  red: 'bg-accent text-white hover:bg-accent-dark',
  navLogin: 'bg-primary text-white rounded-[10px] hover:bg-primary-light',
  navSignup:
    'bg-transparent text-neutral-300 border border-warm/12 rounded-[10px] hover:border-warm/25 hover:text-neutral-100',
};

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

export default function Button({
  variant = 'white',
  size = 'responsive',
  className,
  type = 'button',
  ...props
}: Props) {
  return <button type={type} className={cx(base, sizeClass[size], variantClass[variant], className)} {...props} />;
}
