import { useState } from 'react';
import Button from '@/components/common/Button';
import { TERMS_CONTENT } from '../constants';

export default function Step2({
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
