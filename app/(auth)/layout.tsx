export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-2">
      {/* Left Panel - Brand */}
      <div
        className="hidden md:flex items-center justify-center p-6 relative overflow-hidden"
        style={{
          background: '#059669'
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/login-horse-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.6,
            mixBlendMode: 'multiply'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(5, 150, 105, 0.3)'
          }}
        />
        <div className="text-center relative z-10">
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Dela Gothic One' }}>
            VetTrack
          </h1>
          <p style={{ color: '#86EFAC' }}>Sistema de Medicación y Control Equino</p>
        </div>
      </div>

      {/* Right Panel - Auth Content */}
      <div
        className="flex items-center justify-center p-6"
        style={{ background: '#E8ECEF' }}
      >
        {children}
      </div>
    </div>
  )
}
