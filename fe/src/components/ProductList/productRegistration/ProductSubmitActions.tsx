import Button from '@/components/common/Button';

type Props = {
  isEditMode: boolean;
  isPending: boolean;
  onClose: () => void;
};

export default function ProductSubmitActions({ isEditMode, isPending, onClose }: Props) {
  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={onClose} className="!h-12 !text-sm">
        취소
      </Button>
      <Button type="submit" variant="yellow" disabled={isPending} className="!h-12 !text-sm">
        {isPending ? (isEditMode ? '수정 중...' : '등록 중...') : isEditMode ? '수정하기' : '상품 등록'}
      </Button>
    </div>
  );
}
