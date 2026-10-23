import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // El PDF del informe viaja en base64 dentro del formulario al guardar (para el correo).
      bodySizeLimit: '8mb',
    },
  },
};

export default nextConfig;
