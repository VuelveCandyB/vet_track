export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-2">
      {/* Left Panel - Brand */}
      <div
        className="hidden md:flex items-center justify-center p-6"
        style={{ background: '#059669' }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Dela Gothic One' }}>
            PyAgentix
          </h1>
          <p style={{ color: '#86EFAC' }}>Sistema interno Hipódromo Camarero</p>
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
