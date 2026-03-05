/**
 * Tela Técnica de Debug — com abas para Detecção e GPS
 * Acessível via 5 toques rápidos no mostrador principal
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Radio, MapPin, Navigation, Crosshair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAudioTriggerController } from '@/hooks/useAudioTriggerController';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// Mapeamento de estados nativos para exibição
const STATE_INFO: Record<string, { label: string; color: string; step: number }> = {
  IDLE: { label: 'OCIOSO', color: '#6b7280', step: 0 },
  DISCUSSION_DETECTED: { label: 'DETECTADO', color: '#f59e0b', step: 1 },
  RECORDING_STARTED: { label: 'GRAVANDO', color: '#ef4444', step: 2 },
  DISCUSSION_ENDING: { label: 'FINALIZANDO', color: '#f97316', step: 3 },
  COOLDOWN: { label: 'COOLDOWN', color: '#3b82f6', step: 4 },
};

// Barra de progresso com marcador de threshold
function ThresholdBar({ value, threshold, label, color, maxVal = 1.0 }: {
  value: number; threshold: number; label: string; color: string; maxVal?: number;
}) {
  const pct = Math.min((value / maxVal) * 100, 100);
  const threshPct = (threshold / maxVal) * 100;
  const isAbove = value >= threshold;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-sm font-mono font-bold ${isAbove ? 'text-red-400' : 'text-gray-300'}`}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.1 }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/70"
          style={{ left: `${threshPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-gray-500">
        <span>0%</span>
        <span className="text-white/50">Limite: {(threshold * 100).toFixed(0)}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

// Estado do GPS para atualização periódica
interface GpsState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  altitude: number | null;
  heading: number | null;
  lastUpdate: number | null;
  error: string | null;
}

export function AudioTriggerDebugPage() {
  const navigate = useNavigate();
  const { metrics, state } = useAudioTriggerController();
  const [activeTab, setActiveTab] = useState<'detection' | 'gps'>('detection');

  // Estado GPS com atualização periódica
  const [gps, setGps] = useState<GpsState>({
    latitude: null, longitude: null, accuracy: null,
    speed: null, altitude: null, heading: null,
    lastUpdate: null, error: null,
  });

  // Atualizar GPS periodicamente quando a aba GPS está ativa
  const fetchGps = useCallback(async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      if (isNative) {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
        setGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          lastUpdate: pos.timestamp,
          error: null,
        });
      } else {
        // Fallback web
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGps({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              altitude: pos.coords.altitude,
              heading: pos.coords.heading,
              lastUpdate: pos.timestamp,
              error: null,
            });
          },
          (err) => setGps(prev => ({ ...prev, error: err.message })),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } catch (e: any) {
      setGps(prev => ({ ...prev, error: e.message || 'Erro GPS' }));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'gps') {
      fetchGps();
      const interval = setInterval(fetchGps, 500); // Atualiza a cada 500ms
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchGps]);

  // Dados de detecção
  const nativeState = metrics?.state || 'IDLE';
  const stateKey = typeof nativeState === 'string' ? nativeState : 'IDLE';
  const currentStateInfo = STATE_INFO[stateKey] || STATE_INFO['IDLE'];
  const zcr = metrics?.f0Current ?? 0;
  const isSpeech = metrics?.speechOn ?? false;
  const rmsDb = metrics?.dbfsCurrent ?? -60;
  const noiseFloor = metrics?.noiseFloorDb ?? -60;
  const score = metrics?.score ?? 0;
  const speechDensity = metrics?.speechDensity ?? 0;
  const loudDensity = metrics?.loudDensity ?? 0;
  const gender = metrics?.gender ?? 'UNKNOWN';
  const volumePct = Math.max(0, Math.min(100, ((rmsDb + 60) / 60) * 100));
  const noiseFloorPct = Math.max(0, Math.min(100, ((noiseFloor + 60) / 60) * 100));

  // Velocidade em km/h (speed vem em m/s)
  const speedKmh = gps.speed !== null && gps.speed >= 0 ? gps.speed * 3.6 : null;

  // Classificação de precisão
  const accuracyLabel = gps.accuracy === null ? 'Indisponível'
    : gps.accuracy <= 5 ? 'Excelente' : gps.accuracy <= 15 ? 'Boa'
      : gps.accuracy <= 50 ? 'Moderada' : 'Fraca';
  const accuracyColor = gps.accuracy === null ? 'text-gray-500'
    : gps.accuracy <= 5 ? 'text-green-400' : gps.accuracy <= 15 ? 'text-emerald-400'
      : gps.accuracy <= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Painel Técnico</h1>
      </header>

      {/* Abas */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('detection')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'detection'
            ? 'text-white border-b-2 border-purple-500 bg-purple-500/10'
            : 'text-gray-500 hover:text-gray-300'
            }`}
        >
          <Radio className="w-4 h-4" />
          Detecção
        </button>
        <button
          onClick={() => setActiveTab('gps')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'gps'
            ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
            : 'text-gray-500 hover:text-gray-300'
            }`}
        >
          <MapPin className="w-4 h-4" />
          GPS
        </button>
      </div>

      <main className="flex-1 p-4 space-y-4 overflow-auto pb-8">

        {/* ======= ABA DETECÇÃO ======= */}
        {activeTab === 'detection' && (
          <>
            {/* Microfone com ondas sonoras */}
            <div className="flex flex-col items-center py-4">
              <div className="relative flex items-center justify-center">
                {/* Ondas sonoras — 3 anéis pulsantes */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border"
                    style={{
                      borderColor: isSpeech
                        ? (score >= 0.5 ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.3)')
                        : 'rgba(107,114,128,0.15)',
                    }}
                    animate={isSpeech ? {
                      width: [40 + i * 24, 52 + i * 24, 40 + i * 24],
                      height: [40 + i * 24, 52 + i * 24, 40 + i * 24],
                      opacity: [0.6 - i * 0.15, 0.3 - i * 0.1, 0.6 - i * 0.15],
                    } : {
                      width: 40 + i * 24,
                      height: 40 + i * 24,
                      opacity: 0.1,
                    }}
                    transition={{
                      duration: isSpeech ? 0.8 : 2,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
                {/* Ícone do microfone central */}
                <motion.div
                  className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isSpeech
                      ? (score >= 0.5 ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)')
                      : 'rgba(55,65,81,0.5)',
                    boxShadow: isSpeech
                      ? `0 0 20px ${score >= 0.5 ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.3)'}`
                      : 'none',
                  }}
                  animate={isSpeech ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isSpeech ? (score >= 0.5 ? '#ef4444' : '#a78bfa') : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="11" rx="3" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </motion.div>
              </div>
              <span className={`text-[10px] mt-3 font-medium ${isSpeech ? (score >= 0.5 ? 'text-red-400' : 'text-purple-400') : 'text-gray-600'
                }`}>
                {isSpeech ? (score >= 0.5 ? 'Discussão Ativa' : 'Fala Detectada') : 'Aguardando áudio...'}
              </span>
            </div>
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Frequência de Voz</span>
                <span className={`text-2xl font-black ${!isSpeech ? 'text-gray-600' :
                  gender === 'MALE' ? 'text-blue-400' : 'text-pink-400'
                  }`}>
                  {!isSpeech ? '—' : gender === 'MALE' ? 'H' : gender === 'FEMALE' ? 'M' : '?'}
                </span>
              </div>
              <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div className="absolute inset-y-0 bg-blue-500/20 rounded-l-full"
                  style={{ left: `${(0.02 / 0.25) * 100}%`, width: `${((0.08 - 0.02) / 0.25) * 100}%` }} />
                <div className="absolute inset-y-0 bg-pink-500/20"
                  style={{ left: `${(0.08 / 0.25) * 100}%`, width: `${((0.20 - 0.08) / 0.25) * 100}%` }} />
                {zcr > 0 && isSpeech && (
                  <motion.div
                    className="absolute top-0 bottom-0 w-1 rounded-full shadow-lg"
                    style={{
                      backgroundColor: gender === 'MALE' ? '#60a5fa' : gender === 'FEMALE' ? '#f472b6' : '#9ca3af',
                      boxShadow: `0 0 8px ${gender === 'MALE' ? '#60a5fa' : '#f472b6'}`,
                    }}
                    animate={{ left: `${Math.min((zcr / 0.25) * 100, 100)}%` }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>0.00</span>
                <span className="text-blue-500/60">H: 0.02-0.08</span>
                <span className="text-pink-500/60">M: 0.08-0.20</span>
                <span>0.25</span>
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-500">ZCR Atual: </span>
                <span className="text-sm font-mono text-gray-300">{zcr > 0 ? zcr.toFixed(3) : '—'}</span>
              </div>
            </div>

            {/* Timeline de Detecção */}
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Timeline de Detecção</span>
              <div className="flex items-center justify-between mt-4 mb-2 px-1">
                {Object.entries(STATE_INFO).map(([key, info]) => {
                  const isActive = key === stateKey;
                  const isPast = info.step < currentStateInfo.step;
                  return (
                    <div key={key} className="flex flex-col items-center flex-1">
                      <motion.div
                        className="rounded-full"
                        style={{
                          width: isActive ? 20 : 12, height: isActive ? 20 : 12,
                          backgroundColor: isActive ? info.color : isPast ? info.color + '60' : '#374151',
                          boxShadow: isActive ? `0 0 12px ${info.color}` : 'none',
                        }}
                        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className={`text-[8px] mt-1.5 font-medium text-center leading-tight ${isActive ? 'text-white' : 'text-gray-600'}`}>
                        {info.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-0 px-3 -mt-1 mb-3">
                {Object.entries(STATE_INFO).map(([key, info], idx) => {
                  if (idx === 0) return null;
                  const isPast = info.step <= currentStateInfo.step;
                  return (
                    <div key={key} className="flex-1 h-0.5 rounded-full mx-0.5"
                      style={{ backgroundColor: isPast ? info.color + '80' : '#1f2937' }} />
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-3 py-2 bg-gray-800/50 rounded-xl">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentStateInfo.color }} />
                <span className="text-sm font-bold text-white">{currentStateInfo.label}</span>
              </div>
            </div>

            {/* Barras de Sensibilidade */}
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800 space-y-4">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Sensibilidade</span>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-400">Score de Discussão</span>
                  <span className={`text-lg font-mono font-black ${score >= 0.8 ? 'text-red-400' : score >= 0.5 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {(score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{
                    background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)'
                  }} />
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: score >= 0.8 ? '#ef4444' : score >= 0.5 ? '#eab308' : '#22c55e' }}
                    animate={{ width: `${Math.min(score * 100, 100)}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
              <ThresholdBar value={speechDensity} threshold={0.05} label="Densidade de Fala" color="#3b82f6" />
              <ThresholdBar value={loudDensity} threshold={0.03} label="Densidade de Volume" color="#f59e0b" />
            </div>

            {/* Indicadores Rápidos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/60 rounded-2xl p-3 border border-gray-800">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">RMS</span>
                <div className="mt-1">
                  <span className={`text-xl font-mono font-black ${rmsDb > -30 ? 'text-red-400' : rmsDb > -45 ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {rmsDb.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">dB</span>
                </div>
                <div className="relative h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                  <motion.div className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                    animate={{ width: `${volumePct}%` }} transition={{ duration: 0.15 }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-500/60"
                    style={{ left: `${noiseFloorPct}%` }} />
                </div>
              </div>
              <div className="bg-gray-900/60 rounded-2xl p-3 border border-gray-800">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Piso de Ruído</span>
                <div className="mt-1">
                  <span className="text-xl font-mono font-black text-yellow-400">{noiseFloor.toFixed(1)}</span>
                  <span className="text-xs text-gray-500 ml-1">dB</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${noiseFloor < -40 ? 'bg-green-500' : noiseFloor < -30 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] text-gray-500">
                    {noiseFloor < -40 ? 'Silencioso' : noiseFloor < -30 ? 'Moderado' : 'Ruidoso'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-900/60 rounded-2xl p-3 border border-gray-800">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Fala</span>
                <div className="mt-1 flex items-center gap-2">
                  <motion.div className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: isSpeech ? '#22c55e' : '#374151' }}
                    animate={isSpeech ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }} />
                  <span className={`text-sm font-bold ${isSpeech ? 'text-green-400' : 'text-gray-600'}`}>
                    {isSpeech ? 'ATIVA' : 'Silêncio'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-900/60 rounded-2xl p-3 border border-gray-800">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Volume</span>
                <div className="mt-1 flex items-center gap-2">
                  <motion.div className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: metrics?.loudOn ? '#ef4444' : '#374151' }}
                    animate={metrics?.loudOn ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }} />
                  <span className={`text-sm font-bold ${metrics?.loudOn ? 'text-red-400' : 'text-gray-600'}`}>
                    {metrics?.loudOn ? 'ALTO' : 'Normal'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ======= ABA GPS ======= */}
        {activeTab === 'gps' && (
          <>
            {/* Velocidade */}
            <div className="bg-gray-900/60 rounded-2xl p-5 border border-gray-800 flex flex-col items-center">
              <span className="text-xs text-gray-500 uppercase tracking-wider mb-3">Velocidade</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-mono font-black text-white">
                  {speedKmh !== null ? speedKmh.toFixed(1) : '—'}
                </span>
                <span className="text-lg text-gray-500 font-medium">km/h</span>
              </div>
              {gps.heading !== null && gps.heading >= 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-gray-400">
                  <Navigation className="w-3.5 h-3.5" style={{ transform: `rotate(${gps.heading}deg)` }} />
                  <span className="text-xs">{gps.heading.toFixed(0)}°</span>
                </div>
              )}
            </div>

            {/* Precisão e Altitude */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <Crosshair className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">Precisão</span>
                </div>
                <div>
                  <span className={`text-2xl font-mono font-black ${accuracyColor}`}>
                    {gps.accuracy !== null ? gps.accuracy.toFixed(0) : '—'}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">m</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${gps.accuracy === null ? 'bg-gray-600' :
                    gps.accuracy <= 5 ? 'bg-green-500' : gps.accuracy <= 15 ? 'bg-emerald-500' :
                      gps.accuracy <= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  <span className="text-[10px] text-gray-500">{accuracyLabel}</span>
                </div>
              </div>

              <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Altitude</span>
                <div className="mt-2">
                  <span className="text-2xl font-mono font-black text-gray-300">
                    {gps.altitude !== null ? gps.altitude.toFixed(0) : '—'}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">m</span>
                </div>
              </div>
            </div>

            {/* Coordenadas */}
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800">
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Coordenadas</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Latitude</span>
                  <span className="text-sm font-mono text-gray-300">
                    {gps.latitude !== null ? gps.latitude.toFixed(6) : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Longitude</span>
                  <span className="text-sm font-mono text-gray-300">
                    {gps.longitude !== null ? gps.longitude.toFixed(6) : '—'}
                  </span>
                </div>
              </div>
              {gps.lastUpdate && (
                <div className="mt-3 pt-2 border-t border-gray-800">
                  <span className="text-[10px] text-gray-600">
                    Última atualização: {new Date(gps.lastUpdate).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              )}
            </div>

            {/* Erro GPS */}
            {gps.error && (
              <div className="bg-red-900/20 rounded-2xl p-3 border border-red-800/50">
                <span className="text-xs text-red-400">⚠️ {gps.error}</span>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
