import SideBar from '@/components/common/layouts/SideBar';
import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';

export default function MainPage() {
  return (
    <div className="flex w-full">
      <SideBar items={MAIN_CATEGORY_ITEMS} className="min-h-[calc(100vh-108px)]" />
      <section className="flex flex-1 items-center justify-center p-10 text-[#F5F2EB]">
        <p className="text-xl font-medium">메인 콘텐츠 영역</p>
      </section>
    </div>
  );
}
