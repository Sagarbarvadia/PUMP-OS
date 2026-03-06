import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Factory, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        await login(username, password);
        navigate('/dashboard');
      } catch (err) {
        const msg = err.response?.data?.detail || 'Invalid credentials';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

  

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="w-full lg:w-[420px] flex flex-col justify-center px-8 py-12 bg-white">
        <div className="max-w-sm w-full mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-orange-600 rounded-md flex items-center justify-center">
                <Factory size={18} className="text-white" />
              </div>
              <span className="font-heading font-black text-xl text-slate-900 tracking-tight">PUMP.OS</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-slate-900">Sign in</h1>
            <p className="text-slate-500 text-sm mt-1">Manufacturing ERP — RO Booster Pumps</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" data-testid="login-error">
                <AlertCircle size={15} />
                {error}
              </div>
            )}
            <div>
              <label className="label-overline block mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="admin"
                required
                data-testid="username-input"
              />
            </div>
            <div>
              <label className="label-overline block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 px-3 pr-10 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-medium rounded-md text-sm transition-colors"
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Default credentials</p>
            <p>Username: <span className="font-mono">admin</span> &nbsp; Password: <span className="font-mono">admin123</span></p>
          </div>
        </div>
      </div>

      {/* Right — Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1764185800646-f75f7e16e465?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwzfHxpbmR1c3RyaWFsJTIwZmFjdG9yeSUyMGZsb29yJTIwbWFudWZhY3R1cmluZ3xlbnwwfHx8fDE3NzE1NzE4Nzl8MA&ixlib=rb-4.1.0&q=85"
          alt="Factory floor"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="font-heading text-4xl font-black mb-2">Precision in Production</h2>
          <p className="text-slate-300 text-lg">Track every component. Control every cost.</p>
        </div>
      </div>
    </div>
  );
}
