import axios from 'axios';

const IMAGE_SIZE_EXCEEDED_MESSAGE = '이미지 용량을 확인해주세요.';

export const getUploadErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error) && error.response?.status === 413) {
    return IMAGE_SIZE_EXCEEDED_MESSAGE;
  }

  return fallbackMessage;
};
