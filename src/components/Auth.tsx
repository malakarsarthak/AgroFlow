import React from 'react';
import { 
  Sprout, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  Leaf,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    farmName: ''
  });

  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setIsLoading(false);
      onLogin(data);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-200">
        
        {/* Left Side - Visual/Marketing */}
        <div className="relative hidden lg:block bg-emerald-600 p-12 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[100px]" />
          </div>
          
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl shadow-lg">
                <Leaf className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">AgroFlow</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight">
                Smart Irrigation <br />
                <span className="text-emerald-200">Starts Here.</span>
              </h1>
              <p className="text-emerald-100 text-lg leading-relaxed max-w-md">
                Join thousands of farmers using AI to optimize their water budget and increase crop yields.
              </p>
              
              <div className="space-y-4 pt-8">
                {[
                  'Real-time soil moisture tracking',
                  'AI-powered irrigation schedules',
                  'Precise water budget analytics'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-white/90 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-12">
              <p className="text-emerald-200/60 text-sm font-medium">
                © 2026 AgroFlow Systems. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-12 lg:p-20 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-zinc-500 font-medium">
                {isLogin 
                  ? 'Enter your credentials to access your farm dashboard.' 
                  : 'Start your 30-day free trial today. No credit card required.'}
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="farmer@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Password</label>
                  {isLogin && (
                    <button type="button" className="text-xs font-bold text-emerald-600 hover:text-emerald-500">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Farm Name</label>
                  <div className="relative group">
                    <Sprout className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="Green Valley Farm"
                      value={formData.farmName}
                      onChange={(e) => setFormData({...formData, farmName: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group mt-8"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-zinc-500 font-medium">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-emerald-600 font-bold hover:text-emerald-500 underline underline-offset-4"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
