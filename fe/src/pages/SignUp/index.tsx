import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmailDuplicate } from '@/api/hooks/useGetCheckEmailDuplicate';
import { postIdentityVerification } from '@/api/hooks/usePostIdentityVerification';
import { signUp } from '@/api/hooks/usePostSignUp';
import { requestIdentityVerification } from '@/utils/requestIdentityVerification';
import Button from '@/components/common/Button';
import { useToast } from '@/hooks/useToast';

function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-5 h-5 min-w-5 flex justify-center items-center rounded border-2 relative transition-all duration-150 ${
        checked ? 'border-primary bg-primary' : 'border-neutral-600 bg-transparent'
      }`}
    >
      {checked && (
        <svg
          className="w-3 h-3 text-background pointer-events-none"
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
  );
}

const TERMS_CONTENT = {
  terms: {
    title: '온라인 경매 서비스 이용약관',
    content: `제1조 (목적)
이 약관은 한옥(이하 "회사")이 제공하는 온라인 경매 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
① "서비스"란 회사가 제공하는 온라인 경매 플랫폼 및 관련 부대서비스를 의미합니다.
② "회원"이란 본 약관에 동의하고 회원가입을 완료한 자를 의미합니다.
③ "경매"란 회사의 플랫폼을 통해 진행되는 온라인 입찰 및 낙찰 과정을 의미합니다.
④ "낙찰자"란 경매에서 최고 입찰가를 제시하여 낙찰받은 회원을 의미합니다.

제3조 (약관의 효력 및 변경)
① 이 약관은 서비스 화면에 게시하거나 기타 방법으로 회원에게 공지함으로써 효력이 발생합니다.
② 회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지사항을 통해 사전 고지합니다.
③ 회원이 변경된 약관에 동의하지 않을 경우, 서비스 이용을 중단하고 회원탈퇴를 요청할 수 있습니다.

제4조 (회원가입)
① 서비스 이용을 희망하는 자는 약관에 동의하고 회원가입 신청을 완료해야 합니다.
② 회사는 다음 각 호에 해당하는 경우 회원가입을 거부하거나 취소할 수 있습니다.
  - 타인의 정보를 도용하여 신청한 경우
  - 허위 정보를 기재한 경우
  - 만 14세 미만인 경우
  - 이전에 이용제한 또는 탈퇴 처리된 경우

제5조 (경매 참여)
① 회원은 서비스를 통해 진행되는 경매에 자유롭게 참여할 수 있습니다.
② 입찰은 경매 진행 중 최고 입찰가보다 높은 금액으로만 가능합니다.
③ 낙찰자는 경매 종료 후 회사가 정한 기간 내에 대금을 납부해야 합니다.
④ 낙찰 후 정당한 사유 없이 대금을 납부하지 않을 경우, 서비스 이용이 제한될 수 있습니다.

제6조 (서비스 이용 제한)
회사는 다음 각 호에 해당하는 경우 서비스 이용을 제한하거나 회원 자격을 박탈할 수 있습니다.
① 타인의 계정을 무단 사용한 경우
② 서비스 운영을 방해하는 행위를 한 경우
③ 허위 입찰을 반복적으로 진행한 경우
④ 관련 법령 또는 이 약관을 위반한 경우

제7조 (면책조항)
① 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력적 사유로 인한 서비스 장애에 대해 책임을 지지 않습니다.
② 회원이 서비스 내 게재한 정보의 정확성 및 신뢰성에 대해 회사는 책임을 지지 않습니다.

제8조 (분쟁 해결)
서비스 이용과 관련된 분쟁은 대한민국 법률을 준거법으로 하며, 소송이 제기될 경우 회사 소재지 관할 법원을 전속 관할법원으로 합니다.

부칙
이 약관은 2025년 1월 1일부터 시행합니다.`,
  },
  privacy: {
    title: '개인정보 수집 및 이용 동의',
    content: `한옥(이하 "회사")은 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고, 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.

1. 수집하는 개인정보 항목

[필수 수집 항목]
• 이메일 주소
• 비밀번호
• 닉네임
• 이름 (본인인증을 통해 수집)
• 휴대폰 번호 (본인인증을 통해 수집)
• 생년월일 (본인인증을 통해 수집)

[자동 수집 항목]
• 서비스 이용 기록
• 접속 로그 및 IP 주소
• 쿠키 및 세션 정보

2. 개인정보의 수집 및 이용 목적

• 회원 식별 및 서비스 제공
• 경매 서비스 운영 및 낙찰 처리
• 본인인증 및 성인인증
• 서비스 관련 공지사항 및 안내 발송
• 부정 이용 방지 및 보안 강화
• 고객 불만 처리 및 분쟁 해결

3. 개인정보의 보유 및 이용 기간

• 회원 탈퇴 시까지 보유 및 이용
• 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 별도 보관

[관련 법령에 따른 보존 기간]
• 계약 또는 청약철회에 관한 기록: 5년 (전자상거래법)
• 대금결제 및 재화 공급에 관한 기록: 5년 (전자상거래법)
• 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)
• 접속에 관한 기록: 3개월 (통신비밀보호법)

4. 개인정보의 제3자 제공

회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우에는 예외로 합니다.
• 이용자가 사전에 동의한 경우
• 법령에 의해 제공이 요구되는 경우
• 경매 낙찰 처리를 위해 필요한 최소한의 정보를 관련 기관에 제공하는 경우

5. 개인정보의 파기

회사는 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우, 지체 없이 해당 개인정보를 파기합니다.
• 전자적 파일: 복구 및 재생이 되지 않는 기술적 방법으로 삭제
• 종이 문서: 분쇄기로 분쇄하거나 소각

6. 이용자의 권리

이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
• 개인정보 처리 현황 조회 및 열람
• 오류 정정 요구
• 삭제 요구
• 처리 정지 요구

7. 개인정보 보호책임자

• 담당부서: 개인정보 보호팀
• 이메일: privacy@hanok.com
• 전화번호: 1234-5678

본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.`,
  },
};

function TermsModal({
  type,
  onClose,
}: {
  type: 'terms' | 'privacy';
  onClose: () => void;
}) {
  const { title, content } = TERMS_CONTENT[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-6 py-4 border-b border-neutral-700">
          <h2 className="text-neutral-100 font-semibold text-[16px]">{title}</h2>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex-1 custom-scrollbar">
          <pre className="text-neutral-300 text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
            {content}
          </pre>
        </div>
        <div className="px-6 py-4 border-t border-neutral-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-(--radius-control) bg-neutral-700 hover:bg-neutral-600 text-neutral-100 text-sm font-medium transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

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
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

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
        showToast({ type: 'success', message: `본인인증이 완료되었습니다. (${res.data.name})` });
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
    if (!isEmailVerified) {
      showToast({ type: 'warning', message: '이메일 중복 확인을 해주세요.' });
      return;
    }
    if (!nickname) {
      showToast({ type: 'warning', message: '닉네임을 입력해주세요.' });
      return;
    }
    if (validatePassword(password) || password !== passwordConfirm) {
      showToast({ type: 'warning', message: '비밀번호를 바르게 입력 및 확인해주세요.' });
      return;
    }
    if (!isIdentityVerified || !phone) {
      showToast({ type: 'warning', message: '휴대폰 본인 인증을 완료해주세요.' });
      return;
    }
    if (!termsAgreed || !privacyAgreed) {
      showToast({ type: 'warning', message: '필수 약관에 모두 동의해주세요.' });
      return;
    }

    try {
      await signUp({ email, nickname, password, phone });
      showToast({ type: 'success', message: '회원가입이 완료되었습니다!' });
      navigate('/login');
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', message: '회원가입 처리 중 오류가 발생했습니다.' });
    }
  };

  const inputContainerClass =
    'flex items-center border border-neutral-800 rounded-(--radius-control) h-[52px] px-3 bg-transparent focus-within:border-primary transition-colors';
  const inputClass =
    'flex-1 bg-transparent text-[15px] text-neutral-100 px-2 focus:outline-none placeholder-neutral-600';
  const iconClass = 'w-5 h-5 text-neutral-600';

  return (
    <div className="w-full flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-[480px] text-center mb-10 mx-auto">
        <h1 className="text-neutral-100 text-[32px] font-bold mb-4">회원가입</h1>
        <p className="text-neutral-300 text-[15px]">한옥에 가입하고 경매에 참여해 보세요!</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-[480px] flex flex-col gap-6 mx-auto">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-neutral-300 ml-1">이메일</label>
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
              className="w-auto! px-5 !bg-neutral-200 !text-background hover:!bg-neutral-300"
            >
              중복 확인
            </Button>
          </div>
          {emailError && <p className="text-accent-light text-xs px-1">{emailError}</p>}
          {isEmailVerified && <p className="text-ember-light text-xs px-1">사용 가능한 이메일입니다</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-neutral-300 ml-1">닉네임</label>
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
          <label className="text-[13px] font-medium text-neutral-300 ml-1">비밀번호</label>
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
          {passwordError && <p className="text-accent-light text-xs px-1 -mt-2 mb-1">{passwordError}</p>}

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
            <p className="text-accent-light text-xs px-1">비밀번호가 일치하지 않습니다</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-neutral-300 ml-1">휴대폰 본인인증</label>
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
              className="w-auto! px-5 !bg-neutral-200 !text-background hover:!bg-neutral-300"
            >
              {isIdentityVerified ? '인증완료' : '본인인증'}
            </Button>
          </div>
          {phoneError && <p className="text-accent-light text-xs px-1">{phoneError}</p>}
          {isIdentityVerified && (
            <p className="text-ember-light text-xs px-1">본인인증이 완료되었습니다. ({verifiedName})</p>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <label
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              const allChecked = termsAgreed && privacyAgreed;
              setTermsAgreed(!allChecked);
              setPrivacyAgreed(!allChecked);
            }}
          >
            <CheckboxIcon checked={termsAgreed && privacyAgreed} />
            <span className="text-sm font-semibold text-neutral-100">전체 동의</span>
          </label>
          <div className="border-t border-neutral-800 pt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer" onClick={() => setTermsAgreed(!termsAgreed)}>
                <CheckboxIcon checked={termsAgreed} />
                <span className="text-sm text-neutral-300">온라인 경매 약관 동의 <span className="text-accent-light">[필수]</span></span>
              </label>
              <button
                type="button"
                onClick={() => setModalType('terms')}
                className="text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-2 transition-colors shrink-0 ml-2"
              >
                자세히 보기
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer" onClick={() => setPrivacyAgreed(!privacyAgreed)}>
                <CheckboxIcon checked={privacyAgreed} />
                <span className="text-sm text-neutral-300">개인정보 수집 및 이용 동의 <span className="text-accent-light">[필수]</span></span>
              </label>
              <button
                type="button"
                onClick={() => setModalType('privacy')}
                className="text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-2 transition-colors shrink-0 ml-2"
              >
                자세히 보기
              </button>
            </div>
          </div>
        </div>
        {modalType && <TermsModal type={modalType} onClose={() => setModalType(null)} />}

        <div className="mt-4">
          <Button
            type="submit"
            variant="white"
            size="large"
            className="!bg-neutral-200 !text-background hover:!bg-neutral-300"
          >
            가입 하기
          </Button>
        </div>

        <div className="text-center text-[13px] text-neutral-500 mt-1 flex items-center justify-center gap-1">
          이미 계정이 있으신가요?
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-primary-light font-semibold hover:underline ml-1"
          >
            로그인
          </button>
        </div>
      </form>
    </div>
  );
}
