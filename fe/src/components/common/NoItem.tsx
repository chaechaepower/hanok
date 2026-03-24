type Props = {
  message: string;
  className?: string;
  textClassName?: string;
};

export default function NoItem({ message, className = '', textClassName = '' }: Props) {
  const containerClassName = ['py-16 text-center', className].filter(Boolean).join(' ');
  const contentClassName = ['text-base text-neutral-500', textClassName].filter(Boolean).join(' ');

  return (
    <div className={containerClassName}>
      <p className={contentClassName}>{message}</p>
    </div>
  );
}
