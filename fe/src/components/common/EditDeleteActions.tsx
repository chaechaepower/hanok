import type { MouseEventHandler } from 'react';

type Props = {
  onEdit: MouseEventHandler<HTMLButtonElement>;
  onDelete: MouseEventHandler<HTMLButtonElement>;
  editLabel?: string;
  deleteLabel?: string;
  containerClassName?: string;
  editClassName?: string;
  deleteClassName?: string;
  isDeleteDisabled?: boolean;
};

export default function EditDeleteActions({
  onEdit,
  onDelete,
  editLabel = '수정',
  deleteLabel = '삭제',
  containerClassName = '',
  editClassName = '',
  deleteClassName = '',
  isDeleteDisabled = false,
}: Props) {
  return (
    <div className={containerClassName}>
      <button type="button" onClick={onEdit} className={editClassName}>
        {editLabel}
      </button>
      <button type="button" onClick={onDelete} disabled={isDeleteDisabled} className={deleteClassName}>
        {deleteLabel}
      </button>
    </div>
  );
}
