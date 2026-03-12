import { jwtDecode } from 'jwt-decode';

type JwtPayload = {
  sub: string;
};

export const getUserIdFromToken = (): string | null => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.sub ?? null;
  } catch {
    return null;
  }
};
