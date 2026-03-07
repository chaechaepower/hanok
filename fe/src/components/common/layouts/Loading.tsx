type Props = {
  size?: number;
};

export default function Loading({ size = 24 }: Props) {
  return (
    <div className="flex w-full min-h-[60vh] justify-center px-4 py-20">
      <div
        className="animate-spin rounded-full border-4 border-zinc-200 border-l-zinc-500"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
