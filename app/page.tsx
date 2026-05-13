'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, History, BarChart2, RefreshCw, Zap } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('today');
  const [games, setGames] = useState<any[]>([]); // Fix: Explicitly typed to avoid 'never[]' error
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'today', label: 'Today Games', icon: Calendar },
    { id: 'trends', label: 'Market Trends', icon: TrendingUp },
    { id: 'history', label: 'Betting History', icon: History },
    { id: 'stats', label: 'Analytics', icon: BarChart2 },
  ];

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/predictions');
      const data = await response.json();
      if (Array.isArray(data)) {
        setGames(data);
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const formatOdds = (odds: any) => {
    if (odds === null || odds === undefined || odds === 0) return 'N/A';
    const num = Number(odds);
    return num > 0 ? `+${num}` : num.toString();
  };

  const calculateEdge = (prob: any, odds: any) => {
    const p = Number(prob);
    const o = Number(odds);
    
    if (!o || !p || isNaN(o) || isNaN(p)) return "0.0";
    
    const implied = o > 0 
      ? (100 / (o + 100)) * 100 
      : (Math.abs(o) / (Math.abs(o) + 100)) * 100;
    
    const edge = p - implied;
    return edge.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      {/* Navigation Tabs */}
      <div className="border-b border-white/10 bg-[#1e293b]">
        <div className="max-w-6xl mx-auto flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.id 
                ? 'text-white border-[#e8001d]' 
                : 'text-[#94a3b8] border-transparent hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {activeTab === 'today' ? (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Live MLB Predictions</h2>
                <p className="text-[#94a3b8]">Saberbot Elo vs. FanDuel Market Odds</p>
              </div>
              <button 
                onClick={fetchGames} 
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-colors"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {games.map((game: any, i: number) => {
                const hEdge = calculateEdge(game.homeProb, game.homeOdds);
                const aEdge = calculateEdge(game.awayProb, game.awayOdds);
                const maxEdge = Math.max(Number(hEdge), Number(aEdge));

                return (
                  <div key={i} className="p-6 bg-[#1e293b] border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-2/5">
                        <span className="block text-lg font-bold text-white truncate">{game.awayTeam}</span>
                        <div className="mt-2 space-y-1">
                          <span className="block text-[#e8001d] font-mono text-[10px] font-bold uppercase">
                            Saberbot: {game.awayProb}%
                          </span>
                          <span className="block text-[#00ebff] font-mono text-[10px] font-bold uppercase">
                            FD: {formatOdds(game.awayOdds)}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-[#94a3b8] font-black px-2 py-1 bg-white/5 border border-white/10 rounded mt-2 uppercase">vs</span>

                      <div className="w-2/5 text-right">
                        <span className="block text-lg font-bold text-white truncate">{game.homeTeam}</span>
                        <div className="mt-2 space-y-1">
                          <span className="block text-[#e8001d] font-mono text-[10px] font-bold uppercase">
                            Saberbot: {game.homeProb}%
                          </span>
                          <span className="block text-[#00ebff] font-mono text-[10px] font-bold uppercase">
                            FD: {formatOdds(game.homeOdds)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 text-center">
                        <span className="text-[9px] block text-[#94a3b8] uppercase font-bold mb-1 tracking-widest">Model Pick</span>
                        <span className="text-xs font-bold text-white truncate px-2 block">
                          {Number(game.homeProb) > Number(game.awayProb) ? game.homeTeam : game.awayTeam}
                        </span>
                      </div>

                      <div className="flex-1 bg-[#00ebff]/5 border border-[#00ebff]/20 rounded-xl py-3 text-center">
                        <span className="text-[9px] block text-[#94a3b8] uppercase font-bold mb-1 tracking-widest">Value Edge</span>
                        <span className="text-xs font-mono font-bold text-[#00ebff] flex items-center justify-center gap-1">
                          <Zap size={10} fill="#00ebff" /> 
                          {maxEdge > 0 ? `${maxEdge}%` : "0.0%"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
            <BarChart2 size={48} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-xl text-slate-500 font-medium tracking-tight">Analytics module calibration in progress...</h3>
          </div>
        )}
      </div>
    </div>
  );
}