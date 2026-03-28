export function getEmailValidationError(email: string) {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return '이메일 주소를 입력해주세요.';
  }

  if (!trimmedEmail.includes('@')) {
    return "'@'를 포함한 이메일 주소를 입력해주세요.\n(예: example@hanok.com)";
  }

  if (!trimmedEmail.split('@')[1]?.includes('.')) {
    return '도메인이 올바르지 않습니다.\n(예: example@hanok.com)';
  }

  return '';
}
