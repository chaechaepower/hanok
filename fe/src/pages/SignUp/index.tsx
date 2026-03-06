import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmailDuplicate } from '@/api/hooks/useGetCheckEmailDuplicate';
import { requestSmsCode } from '@/api/hooks/usePostRequestSmsCode';
import { verifySmsCode } from '@/api/hooks/usePostVerifySmsCode';
import { signUp } from '@/api/hooks/usePostSignUp';
import Button from '@/components/common/Button';

export default function SignUpPage() {
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [nickname, setNickname] = useState('');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [phone, setPhone] = useState('');
  const [isSmsRequested, setIsSmsRequested] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [smsToken, setSmsToken] = useState('');
  const [isSmsVerified, setIsSmsVerified] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [smsCodeError, setSmsCodeError] = useState('');

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Form Validation and Handlers (기존과 동일)
  const handleEmailCheck = async () => {
    if (!email.includes('@')) {
      setEmailError('유효한 이메일 형식을 입력해주세요.');
      return;
    }
    try {
      const { isDuplicated } = await checkEmailDuplicate(email);
      if (isDuplicated) {
        setEmailError('이미 사용 중인 이메일입니다.');
        setIsEmailVerified(false);
      } else {
        setEmailError('');
        setIsEmailVerified(true);
        alert('사용 가능한 이메일입니다.');
      }
    } catch (error) {
      console.error(error);
      setEmailError('이메일 중복 확인에 실패했습니다.');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (val.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
    } else {
      setPasswordError('');
    }
  };

  const handleSmsRequest = async () => {
    if (phone.length < 10) {
      setPhoneError('유효한 휴대폰 번호를 입력해주세요.');
      return;
    }
    try {
      await requestSmsCode(phone);
      setIsSmsRequested(true);
      setPhoneError('');
      alert('인증 번호가 발송되었습니다.');
    } catch (error) {
      console.error(error);
      setPhoneError('인증 번호 발송에 실패했습니다.');
    }
  };

  const handleSmsVerify = async () => {
    if (!smsCode) {
      setSmsCodeError('인증 번호를 입력해주세요.');
      return;
    }
    try {
      const res = await verifySmsCode(phone, smsCode);
      if (res.verified && res.sessionToken) {
        setIsSmsVerified(true);
        setSmsToken(res.sessionToken);
        setSmsCodeError('');
        alert('인증이 완료되었습니다.');
      } else {
        setSmsCodeError('인증 번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error(error);
      setSmsCodeError('인증 처리에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailVerified) return alert('이메일 중복 확인을 해주세요.');
    if (!nickname) return alert('닉네임을 입력해주세요.');
    if (password.length < 8 || password !== passwordConfirm) return alert('비밀번호를 바르게 입력 및 확인해주세요.');
    if (!isSmsVerified || !smsToken) return alert('휴대폰 본인 인증을 완료해주세요.');
    if (!termsAgreed || !privacyAgreed) return alert('필수 약관에 모두 동의해주세요.');

    try {
      await signUp({ email, nickname, password, phone, smsToken });
      alert('회원가입이 완료되었습니다!');
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert('회원가입 처리 중 오류가 발생했습니다.');
    }
  };

  // 공통 색상 변수처럼 사용할 클래스
  const inputContainerClass = "flex items-center border border-[#3A3A3C] rounded-[10px] h-[52px] px-3 bg-transparent focus-within:border-[#CEAF82] transition-colors";
  const inputClass = "flex-1 bg-transparent text-[15px] text-white px-2 focus:outline-none placeholder-[#636366]";
  const iconClass = "w-5 h-5 text-[#8E8E93]";

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0B0C10', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center', marginBottom: '40px', marginLeft: 'auto', marginRight: 'auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>회원가입</h1>
        <p style={{ color: '#E5E5EA', fontSize: '15px' }}>한옥에 가입하고 경매에 참여해 보세요!</p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px', marginLeft: 'auto', marginRight: 'auto' }}>
        
        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">이메일</label>
          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <input
              type="email"
              placeholder="example@hanok.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setIsEmailVerified(false); }}
              className={inputClass}
            />
            <Button
              variant="white"
              size="small"
              onClick={handleEmailCheck}
              disabled={isEmailVerified}
              className="!w-auto px-5"
            >
              중복 확인
            </Button>
          </div>
          {emailError && <p className="text-[#FF453A] text-xs px-1">{emailError}</p>}
          {isEmailVerified && <p className="text-[#32D74B] text-xs px-1">사용 가능한 이메일입니다.</p>}
        </div>

        {/* Nickname */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">닉네임</label>
          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <input
              type="text"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">비밀번호</label>
          <div className={`${inputContainerClass} mb-1`}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <input
              type="password"
              placeholder="비밀번호(8자 이상 영문, 숫자 조합)"
              value={password}
              onChange={handlePasswordChange}
              className={inputClass}
            />
          </div>
          {passwordError && <p className="text-[#FF453A] text-xs px-1 -mt-2 mb-1">{passwordError}</p>}
          
          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
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

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">휴대폰 번호</label>
          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <input
              type="text"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
            <Button
              variant="white"
              size="small"
              onClick={handleSmsRequest}
              disabled={isSmsVerified}
              className="!w-auto px-5"
            >
              인증 번호
            </Button>
          </div>
          {phoneError && <p className="text-[#FF453A] text-xs px-1">{phoneError}</p>}

          {/* SMS Code Input */}
          {isSmsRequested && !isSmsVerified && (
            <div className={`${inputContainerClass} mt-1`}>
              <input
                type="text"
                placeholder="인증 번호 입력"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className={`${inputClass} ml-8`}
              />
              <Button
                variant="outline"
                size="small"
                onClick={handleSmsVerify}
                className="!w-auto px-6"
              >
                확인
              </Button>
            </div>
          )}
          {smsCodeError && <p className="text-[#FF453A] text-xs px-1">{smsCodeError}</p>}
          {isSmsVerified && <p className="text-[#32D74B] text-xs px-1">인증이 완료되었습니다.</p>}
        </div>

        {/* Terms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{
              width: '20px', height: '20px', minWidth: '20px',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              borderRadius: '4px', border: `2px solid ${termsAgreed ? '#CEAF82' : '#888'}`,
              backgroundColor: termsAgreed ? '#CEAF82' : 'transparent',
              position: 'relative', transition: 'all 0.15s',
            }}>
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                style={{ appearance: 'none', position: 'absolute', inset: 0, cursor: 'pointer' }}
              />
              {termsAgreed && (
                <svg style={{ width: '12px', height: '12px', color: 'black', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <span style={{ fontSize: '14px', color: '#E5E5EA' }}>온라인 경매 약관 동의 [필수]</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{
              width: '20px', height: '20px', minWidth: '20px',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              borderRadius: '4px', border: `2px solid ${privacyAgreed ? '#CEAF82' : '#888'}`,
              backgroundColor: privacyAgreed ? '#CEAF82' : 'transparent',
              position: 'relative', transition: 'all 0.15s',
            }}>
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                style={{ appearance: 'none', position: 'absolute', inset: 0, cursor: 'pointer' }}
              />
              {privacyAgreed && (
                <svg style={{ width: '12px', height: '12px', color: 'black', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <span style={{ fontSize: '14px', color: '#E5E5EA' }}>개인정보 수집 및 이용 동의 [필수]</span>
          </label>
        </div>

        {/* Submit */}
        <div className="mt-4">
          <Button type="submit" variant="white" size="large">
            가입 하기
          </Button>
        </div>

        {/* Login Link */}
        <div className="text-center text-[13px] text-[#A0A0A0] mt-1 flex items-center justify-center gap-1">
          이미 계정이 있으신가요?
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#C7B282] font-semibold hover:underline"
          >
            로그인
          </button>
        </div>

      </form>
    </div>
  );
}