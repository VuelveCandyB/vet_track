export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-2">
      {/* Left Panel - Brand */}
      <div
        className="hidden md:flex items-center justify-center relative"
        style={{
          background: '#059669',
          backgroundImage: 'url(https://res.cloudinary.com/dee0x7p16/image/upload/v1780914226/hf_20260605_210008_c815785a-4c4d-41bb-9c0e-421788f4ff6a_1_zhzmai.png)',
          backgroundSize: '40%',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5, 150, 105, 0.7)',
            zIndex: 1
          }}
        />
        <div className="text-center p-6 relative z-10">
          <h1 className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Dela Gothic One' }}>
            Sistema de Control Equino
          </h1>
          <p className="text-lg text-white mb-6">Hipódromo Camarero</p>
          <p style={{ color: '#86EFAC' }}>PyAgentix © 2026</p>
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
