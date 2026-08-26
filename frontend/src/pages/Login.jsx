import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Shield, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white mx-auto shadow-subtle mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">SecureGRC</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise Governance, Risk & Compliance Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl border border-border shadow-card p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">Sign in to your organization</h2>
            <p className="text-xs text-slate-500">
              Enter your corporate credentials to access the GRC console.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="ciso@cybercorp.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span>Remember session</span>
              </label>
              <button
                type="button"
                onClick={() => setError('Password reset instructions must be configured by your enterprise IdP.')}
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-xs font-semibold"
              isLoading={isLoading}
            >
              Sign In to Console
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>DEMO CREDENTIALS</span>
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('ciso@cybercorp.com', 'SecurePass2026!')}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 border border-border hover:border-blue-200 rounded text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block text-[11px]">CISO Account</span>
                <span className="text-[10px] text-slate-400 block truncate">ciso@cybercorp.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@securegrc.io', 'AdminPass2026!')}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 border border-border hover:border-blue-200 rounded text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block text-[11px]">Auditor Account</span>
                <span className="text-[10px] text-slate-400 block truncate">admin@securegrc.io</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Compliance Tagline */}
        <div className="text-center mt-6 text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <span>SOC 2 Type II Certified</span>
          <span>•</span>
          <span>End-to-End TLS 1.3</span>
          <span>•</span>
          <span>NIST CSF 2.0 Aligned</span>
        </div>
      </div>
    </div>
  );
}
