import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmailDuplicate } from '@/api/hooks/useGetCheckEmailDuplicate';
import { postIdentityVerification } from '@/api/hooks/usePostIdentityVerification';
import { signUp } from '@/api/hooks/usePostSignUp';
import { requestIdentityVerification } from '@/utils/requestIdentityVerification';
import Button from '@/components/common/Button';

export default function SignUpPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [nickname, setNickname] = useState('');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [phone, setPhone] = useState('');
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const handleEmailCheck = async () => {
    if (!email.includes('@')) {
      setEmailError('유효한 이메일 형식을 입력해주세요.');
      return;
    }
    try {
      await checkEmailDuplicate(email);
      setEmailError('');
      setIsEmailVerified(true);
    } catch {
      setEmailError('이미 사용 중인 이메일입니다.');
      setIsEmailVerified(false);
    }
  };

  const validatePassword = (val: string) => {
    if (val.length < 8 || !/[0-9]/.test(val) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val)) {
      return '비밀번호는 특수문자, 숫자를 포함한 8자 이상이어야 합니다.';
    }
    return '';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    setPasswordError(validatePassword(val));
  };

  const handleIdentityVerification = async () => {
    try {
      setPhoneError('');
      const verificationId = await requestIdentityVerification();
      const res = await postIdentityVerification(verificationId);

      if (res.status === 'SUCCESS') {
        setIsIdentityVerified(true);
        setVerifiedName(res.data.name);
        setPhone(res.data.phoneNumber);
        alert(`본인인증이 완료되었습니다. (${res.data.name})`);
      } else {
        setPhoneError('본인인증에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      setPhoneError('본인인증 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailVerified) return alert('이메일 중복 확인을 해주세요.');
    if (!nickname) return alert('닉네임을 입력해주세요.');
    if (validatePassword(password) || password !== passwordConfirm) return alert('비밀번호를 바르게 입력 및 확인해주세요.');
    if (!isIdentityVerified || !phone) return alert('휴대폰 본인 인증을 완료해주세요.');
    if (!termsAgreed || !privacyAgreed) return alert('필수 약관에 모두 동의해주세요.');

    try {
      await signUp({ email, nickname, password, phone });
      alert('회원가입이 완료되었습니다!');
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert('회원가입 처리 중 오류가 발생했습니다.');
    }
  };

  const inputContainerClass =
    'flex items-center border border-[#3A3A3C] rounded-[10px] h-[52px] px-3 bg-transparent focus-within:border-[#CEAF82] transition-colors';
  const inputClass = 'flex-1 bg-transparent text-[15px] text-white px-2 focus:outline-none placeholder-[#636366]';
  const iconClass = 'w-5 h-5 text-[#8E8E93]';

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center',
          marginBottom: '40px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <h1 style={{ color: '#F5F2EB', fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>회원가입</h1>
        <p style={{ color: '#E5E5EA', fontSize: '15px' }}>한옥에 가입하고 경매에 참여해 보세요!</p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">이메일</label>
          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <input
              type="email"
              placeholder="example@hanok.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsEmailVerified(false);
              }}
              className={inputClass}
            />
            <Button
              variant="white"
              size="small"
              onClick={handleEmailCheck}
              disabled={isEmailVerified}
              className="w-auto! px-5"
            >
              중복 확인
            </Button>
          </div>
          {emailError && <p className="text-[#FF453A] text-xs px-1">{emailError}</p>}
          {isEmailVerified && <p className="text-[#32D74B] text-xs px-1">사용 가능한 이메일입니다.</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">닉네임</label>
          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <input
              type="text"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">비밀번호</label>
          <div className={`${inputContainerClass} mb-1`}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <input
              type="password"
              placeholder="비밀번호(특수문자, 숫자 포함 8자 이상)"
              value={password}
              onChange={handlePasswordChange}
              className={inputClass}
            />
          </div>
          {passwordError && <p className="text-[#FF453A] text-xs px-1 -mt-2 mb-1">{passwordError}</p>}

          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={inputClass}
            />
          </div>
          {passwordConfirm && password !== passwordConfirm && (
            <p className="text-[#FF453A] text-xs px-1">비밀번호가 일치하지 않습니다.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">휴대폰 본인인증</label>
          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
            <input
              type="text"
              placeholder={isIdentityVerified ? `${verifiedName} (${phone})` : '본인인증을 진행해주세요'}
              value={isIdentityVerified ? `${verifiedName} (${phone})` : ''}
              readOnly
              className={inputClass}
            />
            <Button
              variant="white"
              size="small"
              onClick={handleIdentityVerification}
              disabled={isIdentityVerified}
              className="w-auto! px-5"
            >
              {isIdentityVerified ? '인증완료' : '본인인증'}
            </Button>
          </div>
          {phoneError && <p className="text-[#FF453A] text-xs px-1">{phoneError}</p>}
          {isIdentityVerified && <p className="text-[#32D74B] text-xs px-1">본인인증이 완료되었습니다. ({verifiedName})</p>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                minWidth: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '4px',
                border: `2px solid ${termsAgreed ? '#CEAF82' : '#888'}`,
                backgroundColor: termsAgreed ? '#CEAF82' : 'transparent',
                position: 'relative',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                style={{ appearance: 'none', position: 'absolute', inset: 0, cursor: 'pointer' }}
              />
              {termsAgreed && (
                <svg
                  style={{ width: '12px', height: '12px', color: 'black', pointerEvents: 'none' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: '14px', color: '#E5E5EA' }}>온라인 경매 약관 동의 [필수]</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                minWidth: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '4px',
                border: `2px solid ${privacyAgreed ? '#CEAF82' : '#888'}`,
                backgroundColor: privacyAgreed ? '#CEAF82' : 'transparent',
                position: 'relative',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                style={{ appearance: 'none', position: 'absolute', inset: 0, cursor: 'pointer' }}
              />
              {privacyAgreed && (
                <svg
                  style={{ width: '12px', height: '12px', color: 'black', pointerEvents: 'none' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: '14px', color: '#E5E5EA' }}>개인정보 수집 및 이용 동의 [필수]</span>
          </label>
        </div>

        <div className="mt-4">
          <Button type="submit" variant="white" size="large">
            가입 하기
          </Button>
        </div>

        <div className="text-center text-[13px] text-[#A0A0A0] mt-1 flex items-center justify-center gap-1">
          이미 계정이 있으신가요?
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-gold font-semibold hover:underline ml-1"
          >
            로그인
          </button>
        </div>
      </form>
    </div>
  );
}
