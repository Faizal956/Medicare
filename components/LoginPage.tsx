import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
  t: any;
}

const LoginPage: React.FC<LoginPageProps> = ({ t }) => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp && !displayName.trim()) {
      setError(t.nameRequired || 'Display name is required');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t.passwordMin || 'Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = isSignUp
      ? await signup(email, password, displayName.trim())
      : await login(email, password);

    if (result.error) {
      const msg = result.error.message;
      if (msg.includes('Invalid login')) setError(t.invalidCredentials || 'Invalid email or password');
      else if (msg.includes('already registered')) setError(t.emailInUse || 'This email is already registered');
      else if (msg.includes('valid email')) setError(t.invalidEmail || 'Please enter a valid email');
      else setError(msg);
    } else if (isSignUp) {
      setSignupSuccess(true);
    }

    setLoading(false);
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Mail className="text-emerald-600" size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">{t.checkEmail || 'Check Your Email'}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {t.confirmationSent || 'We sent a confirmation link to'} <strong className="text-slate-700">{email}</strong>. 
            {t.clickToVerify || ' Click the link to verify your account, then come back and log in.'}
          </p>
          <button
            onClick={() => { setSignupSuccess(false); setIsSignUp(false); }}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-lg shadow-blue-100"
          >
            {t.backToLogin || 'Back to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
            <Sparkles size={14} /> {t.tagline || 'AI-Powered Health Assistant'}
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Medi-Remind</h1>
          <p className="text-slate-500 text-sm">{t.subtitle || 'Simplified medicine instructions for everyone.'}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100/50 border border-slate-100 p-7 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">
              {isSignUp ? (t.signupTitle || 'Create Account') : (t.loginTitle || 'Welcome Back')}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {isSignUp 
                ? (t.signupSubtitle || 'Sign up to save your data across devices') 
                : (t.loginSubtitle || 'Log in to access your medications')}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm animate-in slide-in-from-top-2 duration-200">
              <AlertCircle size={16} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  {t.displayName || 'Your Name'}
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., Faizal"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                {t.email || 'Email'}
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                {t.password || 'Password'}
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                isSignUp ? (t.signup || 'Sign Up') : (t.login || 'Log In')
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              {isSignUp 
                ? (t.haveAccount || 'Already have an account? Log in') 
                : (t.noAccount || "Don't have an account? Sign up")}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 font-medium px-6">
          {t.authNotice || 'Your data is securely stored and never shared with third parties.'}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
