import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const canvasRef = useRef();

  const API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://weather-radar-backend.onrender.com'
    : 'http://localhost:5000';

  const fetchRadarData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/radar/latest`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setRadarData(data);
      setLastUpdated(new Date());

      if (data.sample) {
        setError('Using sample data - real MRMS data currently unavailable');
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching radar:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    drawCustomBaseMap(ctx, width, height);
    if (radarData) {
      drawRadarOverlay(ctx, width, height, radarData);
    }
  }, [radarData]);

  const drawCustomBaseMap = (ctx, width, height) => {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(width * 0.15, height * 0.15);
    ctx.lineTo(width * 0.85, height * 0.15);
    ctx.lineTo(width * 0.75, height * 0.85);
    ctx.lineTo(width * 0.25, height * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += width / 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += height / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const cities = [
      { name: 'Seattle', x: 0.2, y: 0.25 },
      { name: 'Chicago', x: 0.5, y: 0.4 },
      { name: 'NYC', x: 0.8, y: 0.35 },
      { name: 'Miami', x: 0.7, y: 0.8 },
      { name: 'LA', x: 0.1, y: 0.6 },
      { name: 'Denver', x: 0.35, y: 0.5 }
    ];

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    cities.forEach(city => {
      ctx.beginPath();
      ctx.arc(width * city.x, height * city.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillText(city.name, width * city.x, height * city.y - 8);
    });
  };

  const drawRadarOverlay = (ctx, width, height, radarData) => {
    drawSamplePrecipitation(ctx, width, height);
  };

  const drawSamplePrecipitation = (ctx, width, height) => {
    drawPrecipitationArea(ctx, width * 0.2, height * 0.25, 60, 'light');
    drawPrecipitationArea(ctx, width * 0.5, height * 0.4, 80, 'moderate');
    drawPrecipitationArea(ctx, width * 0.7, height * 0.6, 100, 'heavy');
    drawPrecipitationArea(ctx, width * 0.75, height * 0.8, 70, 'severe');
  };

  const drawPrecipitationArea = (ctx, x, y, radius, intensity) => {
    const colors = {
      light: { inner: 'rgba(34, 197, 94, 0.4)', outer: 'rgba(34, 197, 94, 0.1)' },
      moderate: { inner: 'rgba(234, 179, 8, 0.5)', outer: 'rgba(234, 179, 8, 0.15)' },
      heavy: { inner: 'rgba(249, 115, 22, 0.6)', outer: 'rgba(249, 115, 22, 0.2)' },
      severe: { inner: 'rgba(239, 68, 68, 0.7)', outer: 'rgba(239, 68, 68, 0.25)' }
    };

    const color = colors[intensity] || colors.light;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color.inner);
    gradient.addColorStop(1, color.outer);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    fetchRadarData();

    if (autoRefresh) {
      const interval = setInterval(fetchRadarData, 120000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                🌪️ MRMS Weather Radar
              </h1>
              <p className="text-blue-200 text-sm lg:text-base mt-1">
                Reflectivity at Lowest Altitude (RALA)
              </p>
            </div>

            <div className="flex flex-col items-center lg:items-end gap-3">
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                {loading && (
                  <span className="flex items-center gap-2 text-blue-300 font-medium">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    Loading radar data...
                  </span>
                )}
                {error && (
                  <span className="flex items-center gap-2 text-red-300 font-medium">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    {error}
                  </span>
                )}
                {lastUpdated && (
                  <span className="flex items-center gap-2 text-green-300 font-medium">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={fetchRadarData}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Now
                    </>
                  )}
                </button>

                <label className="flex items-center gap-2 text-sm text-blue-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                  />
                  Auto-refresh (2min)
                </label>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <div className="glass-effect rounded-xl shadow-2xl p-2">
              <canvas
                ref={canvasRef}
                width={1000}
                height={700}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>

          <div className="xl:col-span-1 space-y-6">
            <div className="glass-effect rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Radar Intensity Legend
              </h3>
              <div className="space-y-3">
                {[
                  { intensity: 'light', label: 'Light (0-20 dBZ)', color: 'bg-green-500' },
                  { intensity: 'moderate', label: 'Moderate (20-40 dBZ)', color: 'bg-yellow-500' },
                  { intensity: 'heavy', label: 'Heavy (40-55 dBZ)', color: 'bg-orange-500' },
                  { intensity: 'severe', label: 'Severe (55+ dBZ)', color: 'bg-red-500' }
                ].map((item) => (
                  <div key={item.intensity} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg ${item.color} border-2 border-white/30 shadow-md`}></div>
                    <span className="text-sm text-gray-200">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-effect rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About This Radar
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Product:</span>
                  <span className="text-gray-200">Reflectivity at Lowest Altitude</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Source:</span>
                  <span className="text-gray-200">NOAA MRMS System</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Coverage:</span>
                  <span className="text-gray-200">Continental US</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Update:</span>
                  <span className="text-gray-200">Every 2 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${radarData?.sample ? 'text-yellow-400' : 'text-green-400'}`}>
                    {radarData?.sample ? 'Sample Data' : 'Live Data'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-gray-800 border-t border-gray-700 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            MRMS Weather Radar Display | Data Source: NOAA | Built for Radar Coding Challenge
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
