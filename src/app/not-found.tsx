import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A1F2E, #252B3B)',
      color: '#E8ECF1',
      fontFamily: 'Inter, Noto Sans SC, system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 700, color: '#7C8DA6', lineHeight: 1 }}>404</div>
        <p style={{ fontSize: 16, color: '#8E99A8', marginTop: 16, marginBottom: 24 }}>
          页面不存在或已被移除
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            borderRadius: 12,
            border: '1px solid rgba(124, 141, 166, 0.3)',
            background: 'linear-gradient(135deg, rgba(124, 141, 166, 0.4), rgba(124, 141, 166, 0.2))',
            color: '#E8ECF1',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
