export type ProfileFormState = {
  nickname: string;
  intro: string;
  instaUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
};

type SocialPrefixMap = {
  instagram: string;
  youtube: string;
  tiktok: string;
};

type ProfileEditModalProps = {
  isOpen: boolean;
  form: ProfileFormState;
  socialPrefix: SocialPrefixMap;
  isPending: boolean;
  onClose: () => void;
  onChange: (nextForm: ProfileFormState) => void;
  onSubmit: () => void;
};

export default function ProfileEditModal({
  isOpen,
  form,
  socialPrefix,
  isPending,
  onClose,
  onChange,
  onSubmit,
}: ProfileEditModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-black/90 z-[9999] flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-neutral-800 rounded-2xl w-[600px] p-10 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 text-neutral-100">프로필 수정</h2>

        <div className="flex flex-col gap-2">
          <label className="text-body-lg text-neutral-400 font-medium">닉네임</label>
          <input
            className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg px-4 py-3 text-subtitle-lg outline-none focus:border-gold-light transition-colors"
            value={form.nickname}
            onChange={(e) => onChange({ ...form, nickname: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-body-lg text-neutral-400 font-medium">소개</label>
          <textarea
            className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg px-4 py-3 text-subtitle-lg outline-none focus:border-gold-light transition-colors min-h-[100px] resize-none"
            value={form.intro}
            onChange={(e) => onChange({ ...form, intro: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-body-lg text-neutral-400 font-medium">Instagram</label>
          <div className="flex items-center bg-background border border-neutral-800 rounded-lg overflow-hidden focus-within:border-gold-light transition-colors">
            <span className="shrink-0 px-4 py-3 text-neutral-500 text-body-md bg-neutral-900 border-r border-neutral-800 select-none">
              {socialPrefix.instagram}
            </span>
            <input
              className="flex-1 bg-transparent text-white border-none px-4 py-3 text-subtitle-lg outline-none"
              placeholder="username"
              value={form.instaUrl}
              onChange={(e) => onChange({ ...form, instaUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-body-lg text-neutral-400 font-medium">YouTube</label>
          <div className="flex items-center bg-background border border-neutral-800 rounded-lg overflow-hidden focus-within:border-gold-light transition-colors">
            <span className="shrink-0 px-4 py-3 text-neutral-500 text-body-md bg-neutral-900 border-r border-neutral-800 select-none">
              {socialPrefix.youtube}
            </span>
            <input
              className="flex-1 bg-transparent text-white border-none px-4 py-3 text-subtitle-lg outline-none"
              placeholder="channel"
              value={form.youtubeUrl}
              onChange={(e) => onChange({ ...form, youtubeUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-body-lg text-neutral-400 font-medium">TikTok</label>
          <div className="flex items-center bg-background border border-neutral-800 rounded-lg overflow-hidden focus-within:border-gold-light transition-colors">
            <span className="shrink-0 px-4 py-3 text-neutral-500 text-body-md bg-neutral-900 border-r border-neutral-800 select-none">
              {socialPrefix.tiktok}
            </span>
            <input
              className="flex-1 bg-transparent text-white border-none px-4 py-3 text-subtitle-lg outline-none"
              placeholder="username"
              value={form.tiktokUrl}
              onChange={(e) => onChange({ ...form, tiktokUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4">
          <button
            className="py-3 px-8 bg-neutral-700 text-neutral-200 border-none rounded-lg cursor-pointer text-subtitle-sm hover:bg-neutral-600 transition-colors"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="py-3 px-8 bg-gold-light text-background font-bold border-none rounded-lg cursor-pointer text-subtitle-sm hover:bg-gold-dark transition-colors disabled:opacity-50"
            onClick={onSubmit}
            disabled={isPending}
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
