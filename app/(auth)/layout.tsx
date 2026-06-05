export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-2">
      {/* Left Panel - Brand */}
      <div
        className="hidden md:flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://d8j0ntlcm91z4.cloudfront.net/user_3D2jk5eyOM6W6WlW8vZSJpCgYh2/hf_20260605_210008_c815785a-4c4d-41bb-9c0e-421788f4ff6a.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'top'
        }}
      >
        <div className="text-center relative z-10 p-6">
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
