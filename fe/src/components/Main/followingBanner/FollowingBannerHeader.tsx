import { FaHeart } from 'react-icons/fa';

type Props = {
  title: string;
  description: string;
};

export default function FollowingBannerHeader({ title, description }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-point/15 text-point">
        <FaHeart size={18} />
      </div>
      <div>
        <h2 className="text-[26px] font-semibold leading-tight text-warm">{title}</h2>
        <p className="mt-0.5 text-sm leading-tight text-neutral-500">{description}</p>
      </div>
    </div>
  );
}
