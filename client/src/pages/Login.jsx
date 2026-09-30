import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const buttonRef = useRef(null);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const destination = location.state?.from?.pathname || '/app';

  useEffect(() => {
    if (user) navigate(destination, { replace: true });
  }, [destination, navigate, user]);

  useEffect(() => {
    if (!clientId || user) return undefined;

    const renderButton = () => {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            setError('');
            await signIn(credential);
            navigate(destination, { replace: true });
          } catch (err) {
            setError(err.response?.data?.error || 'Google sign-in could not be completed.');
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
      });
    };

    if (window.google) {
      renderButton();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    script.onerror = () => setError('Google sign-in could not load. Check your connection and try again.');
    document.head.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [clientId, destination, navigate, signIn, user]);

  if (loading || user) return null;

  return (
    <main className="min-h-screen bg-[#F5F2EB] text-[#1B221D] grid lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden lg:flex border-r border-[#D8D2C4] p-12 xl:p-20 flex-col justify-between">
        <Link to="/" className="font-serif text-3xl font-semibold">ProofPoint</Link>
        <div className="max-w-xl">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#5F6A61] mb-5">
            Secure evidence workspace
          </p>
          <h1 className="font-serif text-6xl font-normal leading-[1.02] tracking-tight">
            Access the record behind the work.
          </h1>
          <p className="mt-7 text-lg leading-relaxed text-[#5F6A61] max-w-md">
            Sign in to review field evidence, verification ledgers, and published impact records.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#2F6B4A]">
          <ShieldCheck className="w-4 h-4" /> Evidence workspace
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden font-serif text-3xl font-semibold">ProofPoint</Link>
          <div className="mt-16 lg:mt-0 border-t border-[#D8D2C4] pt-8">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#5F6A61]">Access platform</p>
            <h2 className="font-serif text-4xl mt-3">Continue with Google</h2>
            <p className="text-sm text-[#5F6A61] mt-4">Use your Google account to enter the evidence platform.</p>
            {!clientId ? (
              <div className="mt-8 border border-[#D8D2C4] bg-[#FBF9F4] p-4 text-sm text-[#5F6A61]">
                Google sign-in is not configured yet. Add <code className="font-mono text-xs">VITE_GOOGLE_CLIENT_ID</code> to the client environment, using a Google OAuth Web Application client ID authorized for <code className="font-mono text-xs">http://localhost:5173</code>.
              </div>
            ) : (
              <div ref={buttonRef} className="mt-8 min-h-10" aria-label="Continue with Google" />
            )}
            {error && <p role="alert" className="mt-4 text-sm text-[#A63A2B]">{error}</p>}
            <Link to="/" className="inline-flex items-center gap-2 mt-10 text-xs font-mono uppercase tracking-wider text-[#5F6A61] hover:text-[#1B221D]">
              Return to public landing <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
