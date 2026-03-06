import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterSeller } from '@/api/hooks/usePostRegisterSeller';
import type { BusinessType } from '@/types';
import Button from '@/components/common/Button';

// ─── Step progress indicator ────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: '개인/법인' },
  { id: 2, label: '판매자 약관 동의' },
  { id: 3, label: '정산 계좌' },
  { id: 4, label: '판매자 정보 등록' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step.id === current
                  ? 'bg-[#CEAF82] text-black'
                  : step.id < current
                  ? 'bg-[#3A3A3C] text-[#CEAF82]'
                  : 'bg-[#2C2C2E] text-[#636366]'
              }`}
            >
              {step.id < current ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.id
              )}
            </div>
            <span
              className={`text-sm whitespace-nowrap ${
                step.id === current
                  ? 'text-white font-semibold'
                  : step.id < current
                  ? 'text-[#CEAF82]'
                  : 'text-[#636366]'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <svg
              className="w-5 h-5 mx-3 text-[#3A3A3C] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}


function BusinessTypeCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 h-[120px] rounded-xl text-xl font-semibold transition-all duration-200 cursor-pointer
        ${
          selected
            ? 'bg-[#1C1C1E] border-2 border-[#CEAF82] text-[#CEAF82]'
            : 'bg-[#F5F2EB] border-2 border-transparent text-[#1C1A17]'
        }
      `}
    >
      {label}
    </button>
  );
}

// ─── Step 1: 사업자 인증 ────────────────────────────────────────────────────

function Step1({
  onNext,
}: {
  onNext: () => void;
}) {
  const [businessType, setBusinessType] = useState<BusinessType>('individual');
  const [bizNumber, setBizNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const formatBizNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const handleBizNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBizNumber(e.target.value);
    setBizNumber(formatted);
    setIsVerified(false);
    setVerifyError('');
  };

  const handleVerify = async () => {
    const digits = bizNumber.replace(/\D/g, '');
    if (digits.length !== 10) {
      setVerifyError('사업자등록번호 10자리를 입력해주세요.');
      return;
    }
    setIsVerifying(true);
    setVerifyError('');
    try {
      // TODO: 외부 사업자 인증 API 연동
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsVerified(true);
    } catch {
      setVerifyError('사업자 인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNext = () => {
    if (!isVerified) {
      setVerifyError('사업자 인증을 먼저 완료해주세요.');
      return;
    }
    onNext();
  };

  return (
    <>
      <p style={{ fontSize: '15px', color: '#E5E5EA', marginBottom: '20px' }}>
        개인/법인 사업자 인증을 해주세요.
      </p>

      {/* Business type selector */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <BusinessTypeCard
          label="개인 사업자"
          selected={businessType === 'individual'}
          onClick={() => { setBusinessType('individual'); setIsVerified(false); setVerifyError(''); }}
        />
        <BusinessTypeCard
          label="법인 사업자"
          selected={businessType === 'corporate'}
          onClick={() => { setBusinessType('corporate'); setIsVerified(false); setVerifyError(''); }}
        />
      </div>

      {/* Business registration number input */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
        <input
          type="text"
          value={bizNumber}
          onChange={handleBizNumberChange}
          placeholder="사업자등록번호 -없이 숫자만 입력"
          disabled={isVerified}
          style={{
            flex: 1,
            height: '48px',
            backgroundColor: '#1C1C1E',
            border: `1px solid ${isVerified ? '#CEAF82' : '#3A3A3C'}`,
            borderRadius: '8px',
            color: isVerified ? '#CEAF82' : 'white',
            fontSize: '14px',
            padding: '0 16px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <Button
          variant={isVerified ? 'outline' : 'yellow'}
          size="small"
          onClick={handleVerify}
          disabled={isVerifying || isVerified}
          className="!w-auto px-6"
        >
          {isVerifying ? '인증 중...' : isVerified ? '인증 완료' : '인증 하기'}
        </Button>
      </div>

      {verifyError && (
        <p style={{ color: '#FF453A', fontSize: '13px', paddingLeft: '4px', marginBottom: '8px' }}>
          {verifyError}
        </p>
      )}
      {isVerified && (
        <p style={{ color: '#32D74B', fontSize: '13px', paddingLeft: '4px', marginBottom: '8px' }}>
          사업자 인증이 완료되었습니다.
        </p>
      )}

      {/* Next button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
        <Button variant="white" size="small" onClick={handleNext} className="!w-[120px]">
          다음
        </Button>
      </div>
    </>
  );
}

// ─── Step 2: 판매자 약관 동의 ──────────────────────────────────────────────

const TERMS_CONTENT = [
  {
    title: '판매 상품 등록',
    body: '판매자는 실제 보유한 상품만 등록할 수 있으며 상품의 상태, 구성품, 하자 여부 등 중요한 정보를 정확하게 기재해야 합니다. 허위 정보, 과장된 설명 또는 타인의 지식재산권을 침해하는 상품 등록은 금지됩니다. 잘못된 정보로 인해 발생하는 분쟁에 대한 책임은 판매자에게 있습니다.',
  },
  {
    title: '경매 진행',
    body: '판매자는 경매 시작 가격, 입찰 단위 및 경매 시간을 명확하게 설정해야 하며 경매 진행 중 고의적으로 상품 정보를 변경하거나 입찰을 조작하는 행위를 해서는 안 됩니다. 낙찰자가 결정된 이후 판매자는 정당한 사유 없이 거래를 취소할 수 없습니다.',
  },
  {
    title: '배송 및 거래',
    body: '낙찰이 완료된 경우 판매자는 정해진 기간 내에 상품을 발송해야 하며 안전하게 포장하여 배송해야 합니다. 배송 정보는 플랫폼에 정확하게 등록해야 하며 배송 지연, 미배송 또는 고의적인 거래 지연이 발생할 경우 플랫폼 정책에 따라 제재될 수 있습니다.',
  },
];

function Step2({
  onPrev,
  onNext,
}: {
  onPrev: () => void;
  onNext: () => void;
}) {
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      {/* Terms header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '10px' }}>
          경매 판매자 이용약관 동의
        </h2>
        <p style={{ fontSize: '14px', color: '#C8C8C8', lineHeight: '1.7', marginBottom: '4px' }}>
          한옥(한반도 옥션)에서 판매자로 활동하기 위해서는 아래 약관에 동의해야 합니다.
        </p>
        <p style={{ fontSize: '14px', color: '#C8C8C8', lineHeight: '1.7' }}>
          판매자는 플랫폼 내 경매 진행 및 상품 판매에 대한 책임을 지며, 본 약관을 준수해야 합니다.
        </p>
      </div>

      {/* Terms list */}
      <ol style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px', paddingLeft: '0', listStyle: 'none' }}>
        {TERMS_CONTENT.map((term, idx) => (
          <li key={idx}>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
              {idx + 1}. {term.title}
            </p>
            <p style={{ fontSize: '14px', color: '#C8C8C8', lineHeight: '1.8' }}>
              {term.body}
            </p>
          </li>
        ))}
      </ol>

      {/* Agreement confirmation checkbox */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          marginBottom: '40px',
        }}
      >
        {/* Custom checkbox */}
        <div
          style={{
            width: '20px',
            height: '20px',
            minWidth: '20px',
            borderRadius: '4px',
            border: `2px solid ${agreed ? '#CEAF82' : '#636366'}`,
            backgroundColor: agreed ? '#CEAF82' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            position: 'relative',
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              appearance: 'none',
              position: 'absolute',
              inset: 0,
              cursor: 'pointer',
            }}
          />
          {agreed && (
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
        <span style={{ fontSize: '14px', color: '#E5E5EA' }}>
          판매자 이용약관 및 경매 정책을 모두 확인하고 동의합니다.
        </span>
      </label>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <Button variant="outline" size="small" onClick={onPrev} className="!w-[120px]">
          이전
        </Button>
        <Button variant="white" size="small" onClick={agreed ? onNext : undefined} disabled={!agreed} className="!w-[120px]">
          다음
        </Button>
      </div>
    </>
  );
}

// ─── Step 3: 정산 계좌 ────────────────────────────────────────────────────────

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', '농협은행',
  '기업은행', '카카오뱅크', '토스뱅크', '케이뱅크', '부산은행',
  '대구은행', '광주은행', '전북은행', '경남은행', '제주은행',
  '새마을금고', '신협', '우체국',
];

function Step3({
  onPrev,
  onNext,
}: {
  onPrev: () => void;
  onNext: () => void;
}) {
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    height: '48px',
    backgroundColor: '#1C1C1E',
    border: '1px solid #3A3A3C',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    padding: '0 16px',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
  } as React.CSSProperties;

  const handleSendCode = async () => {
    if (!bank) { setError('은행을 선택해주세요.'); return; }
    if (!accountNumber) { setError('계좌번호를 입력해주세요.'); return; }
    setError('');
    setIsSending(true);
    try {
      // TODO: 계좌 인증번호 전송 API 연동
      await new Promise((r) => setTimeout(r, 800));
      setCodeSent(true);
    } catch {
      setError('인증번호 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode) { setError('인증 번호를 입력해주세요.'); return; }
    setError('');
    setIsVerifying(true);
    try {
      // TODO: 계좌 인증 확인 API 연동
      await new Promise((r) => setTimeout(r, 800));
      setIsVerified(true);
    } catch {
      setError('인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNext = () => {
    if (!isVerified) { setError('계좌 인증을 완료해주세요.'); return; }
    onNext();
  };


  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
          정산받을 은행 계좌 인증을 진행해주세요.
        </h2>
        <p style={{ fontSize: '14px', color: '#C8C8C8' }}>판매 금액이 정산되는 계좌입니다.</p>
      </div>

      {/* 계좌 정보 입력 */}
      <p style={{ fontSize: '14px', color: '#E5E5EA', marginBottom: '12px', fontWeight: '600' }}>계좌 정보 입력</p>

      {/* Bank dropdown */}
      <div style={{ marginBottom: '10px', position: 'relative' }}>
        <select
          value={bank}
          onChange={(e) => { setBank(e.target.value); setError(''); }}
          disabled={isVerified}
          style={{
            ...inputStyle,
            appearance: 'none',
            color: bank ? 'white' : '#636366',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            paddingRight: '40px',
            cursor: isVerified ? 'default' : 'pointer',
          }}
        >
          <option value="" disabled hidden>은행 선택</option>
          {BANKS.map((b) => (
            <option key={b} value={b} style={{ backgroundColor: '#1C1C1E' }}>{b}</option>
          ))}
        </select>
      </div>

      {/* Account number + send code button */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '')); setError(''); }}
          placeholder="계좌번호"
          disabled={isVerified}
          style={{ ...inputStyle, flex: 1 }}
          maxLength={20}
        />
        <Button
          variant={codeSent ? 'outline' : 'yellow'}
          size="small"
          onClick={handleSendCode}
          disabled={isSending || codeSent}
          className="!w-auto px-5"
        >
          {isSending ? '전송 중...' : codeSent ? '전송 완료' : '인증 번호'}
        </Button>
      </div>

      {/* Verify section */}
      {codeSent && (
        <>
          <p style={{ fontSize: '14px', color: '#E5E5EA', marginBottom: '10px', lineHeight: '1.7' }}>
            입력하신 계좌로 1원을 보냈습니다.<br />
            <span style={{ color: '#CEAF82', fontWeight: '600' }}>'한옥'</span> 앞 숫자 3자리를 입력해주세요.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 3)); setError(''); }}
              placeholder="인증 번호 입력"
              disabled={isVerified}
              style={{ ...inputStyle, flex: 1, border: `1px solid ${isVerified ? '#CEAF82' : '#3A3A3C'}`, color: isVerified ? '#CEAF82' : 'white' }}
              maxLength={3}
            />
            <Button
              variant={isVerified ? 'outline' : 'yellow'}
              size="small"
              onClick={handleVerify}
              disabled={isVerifying || isVerified}
              className="!w-auto px-5"
            >
              {isVerifying ? '인증 중...' : isVerified ? '인증 완료' : '인증 하기'}
            </Button>
          </div>
          <p style={{ fontSize: '12px', color: '#636366', lineHeight: '1.7', marginBottom: '8px' }}>
            인증 번호 전송은 일 최대 3회까지 가능합니다.<br />
            신청이 많은 경우, 최대 5분까지 소요될 수 있습니다.
          </p>
        </>
      )}

      {error && (
        <p style={{ color: '#FF453A', fontSize: '13px', paddingLeft: '4px', marginBottom: '8px' }}>{error}</p>
      )}
      {isVerified && (
        <p style={{ color: '#32D74B', fontSize: '13px', paddingLeft: '4px', marginBottom: '8px' }}>계좌 인증이 완료되었습니다.</p>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <Button variant="outline" size="small" onClick={onPrev} className="!w-[120px]">
          이전
        </Button>
        <Button variant="white" size="small" onClick={handleNext} disabled={!isVerified} className="!w-[120px]">
          다음
        </Button>
      </div>
    </>
  );
}

// ─── Step 4: 판매자 정보 등록 ────────────────────────────────────────────────────────

function Step4({
  onPrev,
  businessType,
  businessNumber,
  accountId,
}: {
  onPrev: () => void;
  businessType: 'individual' | 'corporate';
  businessNumber: string | null;
  accountId: number;
}) {
  const navigate = useNavigate();
  const { mutateAsync: registerSeller, isPending } = useRegisterSeller();

  const [nickname, setNickname] = useState('');
  const [intro, setIntro] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [instaLink, setInstaLink] = useState('');
  const [tictokLink, setTictokLink] = useState('');
  const [error, setError] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '48px',
    backgroundColor: '#1C1C1E',
    border: '1px solid #3A3A3C',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    padding: '0 16px',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#E5E5EA',
    fontWeight: '600',
    marginBottom: '10px',
    display: 'block',
  };

  const handleRegister = async () => {
    if (!nickname.trim()) {
      setError('판매자명을 입력해주세요.');
      return;
    }
    setError('');
    try {
      await registerSeller({
        type: businessType,
        businessNumber: businessNumber,
        accountId: accountId,
        nickname: nickname.trim(),
        intro: intro.trim(),
        youtube_link: youtubeLink.trim(),
        insta_link: instaLink.trim(),
        tictok_link: tictokLink.trim(),
      });
      navigate('/');
    } catch {
      setError('판매자 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      {/* 판매자명 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>판매자명</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); setError(''); }}
          placeholder="이름을 입력해주세요"
          style={inputStyle}
          maxLength={20}
        />
      </div>

      {/* 판매자 소개글 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>판매자 소개글</label>
        <input
          type="text"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="상점의 소개를 입력해주세요"
          style={inputStyle}
          maxLength={100}
        />
      </div>

      {/* SNS 링크 */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>SNS 링크(선택)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="url"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            placeholder="유튜브 URL"
            style={inputStyle}
          />
          <input
            type="url"
            value={instaLink}
            onChange={(e) => setInstaLink(e.target.value)}
            placeholder="인스타그램 URL"
            style={inputStyle}
          />
          <input
            type="url"
            value={tictokLink}
            onChange={(e) => setTictokLink(e.target.value)}
            placeholder="틱톡 URL"
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <p style={{ color: '#FF453A', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <Button variant="outline" size="small" onClick={onPrev} className="!w-[120px]">
          이전
        </Button>
        <Button variant="white" size="small" onClick={handleRegister} disabled={isPending} className="!w-[120px]">
          {isPending ? '등록 중...' : '등록'}
        </Button>
      </div>
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SellerOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  // Step 1에서 수집한 데이터를 Step 4 API에 전달하기 위해 상위에서 관리
  const [businessType] = useState<'individual' | 'corporate'>('individual');
  const [businessNumber] = useState<string | null>(null);
  const accountId = 1; // TODO: Step 3에서 인증된 계좌 ID로 대체

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0B0C10',
        color: 'white',
        fontFamily: "'MuseumCulturalFoundationClassic', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '40px',
        paddingBottom: '80px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '720px' }}>
        <StepIndicator current={currentStep} />
        <hr style={{ borderColor: '#2C2C2E', marginBottom: '40px' }} />

        {currentStep === 1 && (
          <Step1 onNext={() => setCurrentStep(2)} />
        )}

        {currentStep === 2 && (
          <Step2
            onPrev={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3
            onPrev={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4
            onPrev={() => setCurrentStep(3)}
            businessType={businessType}
            businessNumber={businessNumber}
            accountId={accountId}
          />
        )}
      </div>
    </div>
  );
}
