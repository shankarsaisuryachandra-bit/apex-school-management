import { useState, useEffect, useRef } from 'react'
import api from '../api/axiosConfig'
import { HiPlay, HiPause, HiSpeakerWave, HiAcademicCap } from 'react-icons/hi2'

export default function PrincipalVoicePlayer() {
  const [data, setData] = useState(null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    fetchAudio()
  }, [])

  const fetchAudio = async () => {
    try {
      const res = await api.get('/announcements/principal-voice')
      setData(res.data)
    } catch (err) {
      console.error('Failed to load voice announcement:', err)
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  if (!data) return null

  return (
    <div className="bg-gradient-to-r from-[#0F2942] to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
      
      {/* Audio Info */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-inner">
          <HiAcademicCap className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-white/10 px-2.5 py-0.5 rounded-full">
            <HiSpeakerWave className="w-3.5 h-3.5" /> Principal's Audio Broadcast
          </span>
          <h3 className="text-base font-extrabold text-white">{data.title}</h3>
          <p className="text-xs text-slate-300 italic max-w-lg">"{data.transcript}"</p>
        </div>
      </div>

      {/* Controls & Player */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <audio
          ref={audioRef}
          src={data.audioUrl}
          onEnded={() => setPlaying(false)}
        />
        <button
          onClick={togglePlay}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          {playing ? <HiPause className="w-5 h-5" /> : <HiPlay className="w-5 h-5" />}
          <span>{playing ? 'Pause Address' : 'Listen to Address'}</span>
        </button>
      </div>

    </div>
  )
}
