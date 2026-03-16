import { useState } from 'react';
import Button from '@/components/common/Button';
import { TERMS_CONTENT } from '../../pages/SellerOnboarding/constants';

export default function Step2({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleTerm = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div style={{ contain: 'inline-size' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '10px' }}>
          경매 판매자 이용약관 동의
        </h2>
        <p style={{ fontSize: '14px', color: '#C7B282', lineHeight: '1.7', marginBottom: '4px' }}>
          한옥(한반도 옥션)에서 판매자로 활동하기 위해서는 아래 약관에 동의해야 합니다.
        </p>
        <p style={{ fontSize: '14px', color: '#C7B282', lineHeight: '1.7' }}>
          판매자는 플랫폼 내 경매 진행 및 상품 판매에 대한 책임을 지며, 본 약관을 준수해야 합니다.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        {TERMS_CONTENT.map((term, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              style={{
                border: '1px solid #2C2C2E',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleTerm(idx)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '700',
                  fontFamily: 'inherit',
                }}
              >
                <span>
                  {idx + 1}. {term.title}
                </span>
                <svg
                  style={{
                    width: '16px',
                    height: '16px',
                    color: '#636366',
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                  }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 16px 20px' }}>
                  <p style={{ fontSize: '14px', color: '#C8C8C8', lineHeight: '1.8' }}>{term.body}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          marginBottom: '40px',
        }}
      >
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

      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'sticky', bottom: 0, paddingTop: '24px', paddingBottom: '24px' }}>
        <Button variant="outline" onClick={onPrev} className="w-30!">
          이전
        </Button>
        <Button onClick={agreed ? onNext : undefined} disabled={!agreed} className="w-30!">
          다음
        </Button>
      </div>
    </div>
  );
}
