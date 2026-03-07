import Skeleton from "@/components/ui/Skeleton";

export default function MainSkeleton() {
  return (
    <div className="flex flex-col gap-[110px]">
      <div className="flex flex-col gap-[50px]">
        <Skeleton
          width="960px"
          height="44px"
          borderRadius="16px"
          className="max-w-full"
        />
        <Skeleton
          width="960px"
          height="400px"
          borderRadius="0px"
          className="max-w-full"
        />
      </div>
    </div>
  );
}
