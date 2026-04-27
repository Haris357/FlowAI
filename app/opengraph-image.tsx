import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';
export const alt = 'Flowbooks — AI-First Accounting';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a1f1a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#D97757',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            F
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>Flowbooks</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            Just say it. Done.
          </div>
          <div style={{ fontSize: 36, color: '#D97757', fontWeight: 500 }}>
            AI-first accounting that understands you.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 24,
            color: '#888',
          }}
        >
          <div>flowbooksai.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
