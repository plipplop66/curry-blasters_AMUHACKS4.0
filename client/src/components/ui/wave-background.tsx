import React from "react";

interface WaveBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function WaveBackground({ children, className = "" }: WaveBackgroundProps) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-r from-pink-200 via-pink-100 to-orange-100 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23FFB4A2' fill-opacity='0.4' d='M0,192L48,165.3C96,139,192,85,288,96C384,107,480,181,576,213.3C672,245,768,235,864,202.7C960,171,1056,117,1152,101.3C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {children}
    </div>
  );
}
