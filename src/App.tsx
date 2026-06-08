import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle, X, FileText, Download, Award, Mail, Lock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import ReactPlayer from 'react-player';
import ReactMarkdown from 'react-markdown';
import { supabase } from './lib/supabase';
import { certificadoBase64 } from './assets/certificadoBase64';
import { AppShell } from './layout/AppShell';
import { HomePage } from './pages/HomePage';
import { ModulePage } from './pages/ModulePage';
import { TrackPage } from './pages/TrackPage';
import { CommunityPage } from './pages/CommunityPage';
import { ChannelPage } from './pages/ChannelPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { QuizTaker } from './components/quiz/QuizTaker';
import { VideoNotes } from './components/VideoNotes';
import { useUserRole } from './hooks/useUserRole';
import { formatTime } from './utils/thumbnail';
import type { User, Video, AppView } from './types';

// ─── Certificate Modal ────────────────────────────────────────────────────────

function CertificateModal({ moduleName, user, onClose }: { moduleName: string; user: User; onClose: () => void }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    const loadingId = toast.loading('Gerando certificado...');
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas não suportado');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const nameFontSize = canvas.height * 0.055;
        const moduleFontSize = canvas.height * 0.025;
        const dateFontSize = canvas.height * 0.020;
        const displayName = user.name.length > 60 ? user.name.slice(0, 57) + '...' : user.name;
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#111827';
        ctx.font = `${nameFontSize}px "Times New Roman", Times, serif`;
        ctx.fillText(displayName, canvas.width / 2, canvas.height * 0.312);
        ctx.textAlign = 'center'; ctx.fillStyle = '#1f2937';
        ctx.font = `${moduleFontSize}px Arial, Helvetica, sans-serif`;
        ctx.fillText(moduleName.toUpperCase(), canvas.width / 2, canvas.height * 0.437);
        ctx.textAlign = 'center'; ctx.fillStyle = '#1f2937';
        ctx.font = `${dateFontSize}px Arial, Helvetica, sans-serif`;
        ctx.fillText(new Date().toLocaleDateString('pt-BR'), canvas.width * 0.262, canvas.height * 0.639);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `Certificado_${moduleName.replace(/\s+/g, '_')}.jpg`;
        link.href = dataUrl; link.click();
        toast.success('Certificado baixado!', { id: loadingId });
        setIsGenerating(false);
      };
      img.onerror = () => { toast.error('Erro ao carregar imagem.', { id: loadingId }); setIsGenerating(false); };
      img.src = certificadoBase64;
    } catch {
      toast.error('Erro ao gerar certificado.', { id: loadingId });
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8">
        <button onClick={onClose} className="absolute -top-12 right-0 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors z-10">
          <X className="w-8 h-8" />
        </button>
        <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl">
          <div className="relative">
            <div className="w-full aspect-[1.414/1] relative flex flex-col items-center justify-center overflow-hidden bg-white">
              <img src={certificadoBase64} alt="Certificado" className="absolute inset-0 w-full h-full object-cover z-0" />
              <div className="absolute inset-0 z-10">
                <div className="absolute w-full text-center px-12" style={{ top: '31.2%', transform: 'translateY(-100%)' }}>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-normal text-gray-900 tracking-wide leading-none" style={{ fontFamily: 'serif' }}>{user.name}</h2>
                </div>
                <div className="absolute w-full text-center px-12" style={{ top: '43.7%', transform: 'translateY(-100%)' }}>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-medium text-gray-800 uppercase tracking-wider leading-none">{moduleName}</h3>
                </div>
                <div className="absolute text-center w-48" style={{ top: '63.9%', left: '26.2%', transform: 'translate(-50%, -100%)' }}>
                  <p className="font-normal text-gray-800 text-sm md:text-base leading-none">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-950 p-6 flex justify-center border-t border-gray-800">
            <button onClick={handleDownload}
              className="px-8 py-4 rounded-xl font-bold text-gray-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              <Download className="w-6 h-6 mr-3" /> Baixar Certificado
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Video Player Modal ───────────────────────────────────────────────────────

function VideoPlayerModal({ video, user, userProgress, onComplete, onClose, onSavePosition, seekTo }: {
  video: Video; user: User; userProgress: Record<string, boolean>;
  onComplete: (videoId: string) => void; onClose: () => void;
  onSavePosition: (videoId: string, pos: number) => void; seekTo: number;
}) {
  const [watchedSeconds, setWatchedSeconds] = useState(seekTo);
  const [lastPlayedSeconds, setLastPlayedSeconds] = useState(seekTo);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const hasSeked = useRef(false);
  const lastSavedPos = useRef(seekTo);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
          <h3 className="text-lg font-medium text-white truncate pr-4">{video.title}</h3>
          <div className="flex items-center gap-4">
            <select value={playbackRate} onChange={e => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-gray-800 text-white text-sm rounded-lg px-2 py-1 border border-gray-700 outline-none focus:border-cyan-500 cursor-pointer">
              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(r => (
                <option key={r} value={r}>{r === 1 ? '1x (Normal)' : `${r}x`}</option>
              ))}
            </select>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="relative pt-[56.25%] bg-black flex-shrink-0">
          <ReactPlayer
            key={video.id}
            src={video.url}
            className="absolute top-0 left-0"
            width="100%" height="100%"
            controls playing={isPlaying} playbackRate={playbackRate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={e => console.error('Erro no player:', e)}
            onDurationChange={e => {
              const dur = e.currentTarget.duration;
              if (dur) {
                setDuration(dur);
                if (seekTo > 30 && !hasSeked.current) {
                  hasSeked.current = true;
                  e.currentTarget.currentTime = seekTo;
                  toast.info(`▶ Retomando de ${formatTime(seekTo)}`, { duration: 3000 });
                }
              }
            }}
            onTimeUpdate={e => {
              const playedSeconds = e.currentTarget.currentTime;
              const diff = playedSeconds - lastPlayedSeconds;
              let nextWatched = watchedSeconds;
              if (diff > 0 && diff < 2) { nextWatched = watchedSeconds + diff; setWatchedSeconds(nextWatched); }
              setLastPlayedSeconds(playedSeconds);
              if (Math.abs(playedSeconds - lastSavedPos.current) >= 10) {
                lastSavedPos.current = playedSeconds;
                onSavePosition(video.id, playedSeconds);
              }
              if (duration > 0 && nextWatched / duration >= 0.95 && !userProgress[video.id]) {
                onComplete(video.id);
              }
            }}
          />
        </div>

        {/* Progress bar */}
        <div className="p-4 bg-gray-950 flex justify-between items-center text-sm border-b border-gray-800 flex-shrink-0">
          <div className="text-gray-400">
            Visualização: <span className="text-cyan-400 font-mono">{duration > 0 ? Math.round((watchedSeconds / duration) * 100) : 0}%</span>
            <span className="ml-2 text-xs text-gray-500">(95% para concluir)</span>
          </div>
          {userProgress[video.id] && (
            <div className="flex items-center text-cyan-400 font-medium">
              <CheckCircle className="w-4 h-4 mr-1" /> Concluída
            </div>
          )}
        </div>

        {/* Content */}
        {video.content && (
          <div className="p-6 bg-gray-900 overflow-y-auto max-h-[35vh] custom-scrollbar">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-pink-400" /> Material Complementar
            </h4>
            <div className="prose prose-invert prose-cyan max-w-none">
              <ReactMarkdown>{video.content}</ReactMarkdown>
            </div>
          </div>
        )}
        <VideoNotes videoId={video.id} userId={user.id} />
      </div>
    </motion.div>
  );
}

// ─── Auth Pages ───────────────────────────────────────────────────────────────

function AuthPage() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [church, setChurch] = useState('');
  const [hasCell, setHasCell] = useState('nao');
  const [cellGroup, setCellGroup] = useState('');
  const [hasMinistry, setHasMinistry] = useState('nao');
  const [ministry, setMinistry] = useState('');
  const [conversionTime, setConversionTime] = useState('');

  // Helpers — apikey na URL, Blob como body para evitar QUALQUER problema com headers
  const sbUrl = (): string => (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const sbKey = (): string => ((import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '').replace(/[^A-Za-z0-9\-_.]/g, '');
  const authUrl = (path: string, extra = ''): string => `${sbUrl()}/auth/v1/${path}?apikey=${sbKey()}${extra}`;
  // jsonBlob: transforma objeto em Blob com Content-Type application/json
  // O browser lê o tipo do Blob automaticamente — nenhum header customizado necessário
  const jsonBlob = (data: unknown) => new Blob([JSON.stringify(data)], { type: 'application/json' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(authUrl('token', '&grant_type=password'), { method: 'POST', body: jsonBlob({ email, password }) });
      const json = await res.json();
      if (!res.ok) { toast.error('E-mail ou senha inválidos.'); return; }
      await supabase.auth.setSession({ access_token: json.access_token, refresh_token: json.refresh_token });
    } catch { toast.error('Erro de conexão. Tente novamente.'); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    try {
      // Usa Blob como body: nenhum header customizado é passado ao fetch,
      // eliminando qualquer possibilidade de erro ISO-8859-1
      const res = await fetch(authUrl('signup'), { method: 'POST', body: jsonBlob({ email, password }) });
      const json = await res.json();
      if (!res.ok) {
        toast.error('Erro ao cadastrar: ' + (json.message || json.msg || json.error_description || 'Tente novamente.'));
        return;
      }

      const userId: string | undefined = json.id ?? json.user?.id;
      if (json.access_token) {
        await supabase.auth.setSession({ access_token: json.access_token, refresh_token: json.refresh_token });
      }
      if (userId) {
        await supabase.from('user_profiles').insert({
          user_id: userId, name, birth_date: birthDate, city, church,
          cell_group: hasCell === 'sim' ? cellGroup : '',
          ministry: hasMinistry === 'sim' ? ministry : '',
          conversion_time: conversionTime,
        });
      }
      await supabase.auth.signOut();
      toast.success('Cadastro realizado! Faça login.');
      setAuthMode('login');
      setPassword('');
    } catch (err: unknown) {
      toast.error('Erro ao cadastrar: ' + (err instanceof Error ? err.message : 'Erro de rede.'));
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: `${window.location.origin}/?reset=true` });
    if (error) toast.error(error.message);
    else { toast.success('Link enviado! Verifique seu e-mail.'); setForgotEmail(''); setAuthMode('login'); }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
      <Toaster theme="dark" position="top-center" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/10 blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <img src="https://lh3.googleusercontent.com/d/1pJASlSKVV2jccAQOE1X4UYVgQd1m6k1q" alt="Logo" className="h-24 mx-auto mb-4 object-contain" referrerPolicy="no-referrer" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">Mergulhando na Palavra</h1>
          <p className="text-gray-400 mt-2">Plataforma de Estudo Online</p>
        </div>

        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
              <div className="relative"><Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="seu@email.com" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
              <div className="relative"><Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="••••••••" /></div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setAuthMode('forgot')} className="text-sm text-cyan-400 hover:underline">Esqueceu a senha?</button>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">Entrar</button>
            <div className="text-center mt-4">
              <span className="text-gray-400">Não tem uma conta? </span>
              <button type="button" onClick={() => setAuthMode('register')} className="text-pink-400 hover:underline font-medium">Cadastre-se aqui</button>
            </div>
          </form>
        )}

        {authMode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-gray-300 text-sm text-center mb-4">Digite seu e-mail para receber o link de recuperação.</p>
            <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="seu@email.com" />
            <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">Recuperar Senha</button>
            <button type="button" onClick={() => setAuthMode('login')} className="w-full text-gray-400 hover:text-white py-2">Voltar ao Login</button>
          </form>
        )}

        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {[
              { label: 'Nome Completo (para certificado)', value: name, setter: setName, type: 'text', required: true, maxLength: 80 },
              { label: 'E-mail', value: email, setter: setEmail, type: 'email', required: true },
              { label: 'Senha', value: password, setter: setPassword, type: 'password', required: true },
              { label: 'Data de Nascimento', value: birthDate, setter: setBirthDate, type: 'date', required: true },
              { label: 'Cidade que reside', value: city, setter: setCity, type: 'text', required: true },
              { label: 'Igreja que frequenta', value: church, setter: setChurch, type: 'text', required: true },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-medium text-gray-400 mb-1">{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)} required={f.required} maxLength={f.maxLength}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Frequenta célula?</label>
              <select value={hasCell} onChange={e => setHasCell(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500">
                <option value="nao">Não</option><option value="sim">Sim</option>
              </select>
            </div>
            {hasCell === 'sim' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Qual célula?</label>
                <input type="text" value={cellGroup} onChange={e => setCellGroup(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Serve em algum ministério?</label>
              <select value={hasMinistry} onChange={e => setHasMinistry(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500">
                <option value="nao">Não</option><option value="sim">Sim</option>
              </select>
            </div>
            {hasMinistry === 'sim' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Qual ministério?</label>
                <input type="text" value={ministry} onChange={e => setMinistry(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Quanto tempo de convertido?</label>
              <input type="text" value={conversionTime} onChange={e => setConversionTime(e.target.value)} required placeholder="Ex: 2 anos" className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 rounded-xl hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all mt-4">Finalizar Cadastro</button>
            <button type="button" onClick={() => setAuthMode('login')} className="w-full text-gray-400 hover:text-white py-2">Já tenho uma conta</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [videoPositions, setVideoPositions] = useState<Record<string, number>>({});
  const [quizPassed, setQuizPassed] = useState<Record<string, boolean>>({});
  const [currentView, setCurrentView] = useState<AppView>({ name: 'home' });
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeQuizModule, setActiveQuizModule] = useState<string | null>(null);
  const [activeCertificateModule, setActiveCertificateModule] = useState<string | null>(null);

  const role = useUserRole(user?.id, user?.email);

  // Busca nome do perfil na tabela user_profiles (evita metadados no header)
  const resolveUser = async (authUser: { id: string; email?: string }) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('user_id', authUser.id)
      .maybeSingle();
    const name = profile?.name || authUser.email?.split('@')[0] || 'Aluno';
    setUser({ id: authUser.id, name, email: authUser.email || '', isAdmin: authUser.email === 'byffrk@gmail.com' });
  };

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) resolveUser(session.user);
      setLoadingAuth(false);
    }).catch(() => setLoadingAuth(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        resolveUser(session.user);
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch data
  useEffect(() => {
    if (user) { fetchVideos(); fetchProgress(user.id); fetchQuizPassed(user.id); }
  }, [user]);

  const fetchVideos = async () => {
    const { data } = await supabase.from('videos').select('*').order('order_in_module', { ascending: true }).order('created_at', { ascending: true });
    if (data) setVideos(data);
  };

  const fetchProgress = async (userId: string) => {
    const { data } = await supabase.from('user_progress').select('video_id, completed, last_position').eq('user_id', userId);
    if (!data) return;
    const progressMap: Record<string, boolean> = {};
    const positionsMap: Record<string, number> = {};
    data.forEach((p: any) => {
      if (p.completed) progressMap[p.video_id] = true;
      if (p.last_position && p.last_position > 10) positionsMap[p.video_id] = p.last_position;
    });
    setUserProgress(progressMap);
    setVideoPositions(positionsMap);
  };

  const fetchQuizPassed = async (userId: string) => {
    const { data } = await supabase.from('quiz_attempts').select('quiz_id, passed, quizzes(module_name)').eq('user_id', userId).eq('passed', true);
    const passed: Record<string, boolean> = {};
    (data ?? []).forEach((a: any) => { if (a.quizzes?.module_name) passed[a.quizzes.module_name] = true; });
    setQuizPassed(passed);
  };

  const saveVideoPosition = async (videoId: string, position: number) => {
    if (!user || position < 10) return;
    setVideoPositions(prev => ({ ...prev, [videoId]: position }));
    await supabase.from('user_progress').upsert({ user_id: user.id, video_id: videoId, completed: userProgress[videoId] ?? false, last_position: position }, { onConflict: 'user_id,video_id' });
  };

  const handleComplete = (videoId: string) => {
    if (userProgress[videoId]) return;
    setUserProgress(prev => ({ ...prev, [videoId]: true }));
    supabase.from('user_progress').upsert({ user_id: user!.id, video_id: videoId, completed: true, last_position: videoPositions[videoId] ?? 0 }, { onConflict: 'user_id,video_id' })
      .then(({ error }) => {
        if (error) setUserProgress(prev => { const n = { ...prev }; delete n[videoId]; return n; });
      });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setUserProgress({}); setVideos([]);
  };

  const openVideo = (video: Video) => {
    const alreadyDone = userProgress[video.id] ?? false;
    const savedPos = !alreadyDone && (videoPositions[video.id] ?? 0) > 30 ? videoPositions[video.id] : 0;
    setActiveVideo(video);
    // pre-fill watched seconds so banner shows correct position
    void savedPos;
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const renderView = () => {
    switch (currentView.name) {
      case 'home':
        return (
          <HomePage
            videos={videos}
            userProgress={userProgress}
            videoPositions={videoPositions}
            role={role}
            onNavigate={setCurrentView}
            onPlayVideo={openVideo}
          />
        );
      case 'trilha':
        return (
          <TrackPage
            trackId={currentView.trackId}
            videos={videos}
            userProgress={userProgress}
            onNavigate={setCurrentView}
          />
        );
      case 'modulo':
        return (
          <ModulePage
            moduleName={currentView.moduleName}
            videos={videos.filter(v => v.module === currentView.moduleName)}
            allVideos={videos}
            userProgress={userProgress}
            videoPositions={videoPositions}
            quizPassed={quizPassed}
            role={role}
            onNavigate={setCurrentView}
            onPlayVideo={openVideo}
            onOpenQuiz={setActiveQuizModule}
            onOpenCertificate={setActiveCertificateModule}
          />
        );
      case 'comunidade':
        return <CommunityPage role={role} onNavigate={setCurrentView} />;
      case 'canal':
        return <ChannelPage channelId={currentView.channelId} user={user} role={role} onNavigate={setCurrentView} />;
      case 'post':
        return <PostDetailPage postId={currentView.postId} channelId={currentView.channelId} user={user} role={role} onNavigate={setCurrentView} />;
      case 'perfil':
        return <ProfilePage user={user} role={role} videos={videos} userProgress={userProgress} quizPassed={quizPassed} />;
      case 'admin':
        return (role === 'admin' || role === 'moderator')
          ? <AdminPage videos={videos} role={role} onVideosChange={fetchVideos} onNavigate={setCurrentView} />
          : <HomePage videos={videos} userProgress={userProgress} videoPositions={videoPositions} role={role} onNavigate={setCurrentView} onPlayVideo={openVideo} />;
      default:
        return <HomePage videos={videos} userProgress={userProgress} videoPositions={videoPositions} role={role} onNavigate={setCurrentView} onPlayVideo={openVideo} />;
    }
  };

  return (
    <>
      <Toaster theme="dark" position="top-center" />
      <AppShell user={user} role={role} currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} videos={videos}>
        {renderView()}
      </AppShell>

      {/* Modals */}
      <AnimatePresence>
        {activeVideo && (
          <VideoPlayerModal
            key={activeVideo.id}
            video={activeVideo}
            user={user}
            userProgress={userProgress}
            onComplete={handleComplete}
            onClose={() => setActiveVideo(null)}
            onSavePosition={saveVideoPosition}
            seekTo={!userProgress[activeVideo.id] && (videoPositions[activeVideo.id] ?? 0) > 30 ? videoPositions[activeVideo.id] : 0}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeQuizModule && (
          <QuizTaker
            moduleName={activeQuizModule}
            userId={user.id}
            onClose={() => setActiveQuizModule(null)}
            onPassed={() => {
              setQuizPassed(prev => ({ ...prev, [activeQuizModule]: true }));
              setActiveQuizModule(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCertificateModule && (
          <CertificateModal
            moduleName={activeCertificateModule}
            user={user}
            onClose={() => setActiveCertificateModule(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
