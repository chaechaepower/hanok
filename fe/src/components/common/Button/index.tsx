import React from 'react';

type Props = {
  variant?: 'outline' | 'yellowOutline' | 'white' | 'black' | 'red' | 'yellow';
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
  outline: 'bg-transparent text-white shadow-[0_0_0_1px_#ffffff_inset] hover:bg-zinc-900',
  yellowOutline: 'bg-transparent text-[#C7B282] shadow-[0_0_0_1px_#C7B282_inset] hover:bg-zinc-900',
  white: 'bg-[#F5F2EB] text-[#0A0C13] hover:bg-[#E4DFD6]',
  black: 'bg-[#0A0C13] text-white hover:bg-black',
  yellow: 'bg-[#C7B282] text-[#0A0C13] hover:bg-[#C09C57]',
  red: 'bg-[#EF4444] text-white hover:bg-[#da001d]',
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
