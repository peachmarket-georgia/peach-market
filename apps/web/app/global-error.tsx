'use client'

const GlobalError = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  return (
    <html lang="ko">
      <body className="antialiased">
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#FAFAFA',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <p style={{ fontSize: '3.75rem', marginBottom: '1rem' }}>😥</p>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#171717', marginBottom: '0.5rem' }}>
              문제가 발생했습니다
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#737373', marginBottom: '2rem' }}>
              일시적인 오류가 발생했습니다. 다시 시도하거나 잠시 후 이용해주세요.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  maxWidth: '12rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(to right, #f97272, #D4572F)',
                  color: 'white',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                다시 시도
              </button>
              <a
                href="/"
                style={{
                  width: '100%',
                  maxWidth: '12rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: '2px solid #E5E5E5',
                  color: '#171717',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                }}
              >
                홈으로
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

export default GlobalError
