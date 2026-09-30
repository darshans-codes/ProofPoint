import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, loading, signIn, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const buttonRef = useRef(null);
  const [error, setError] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const destination = location.state?.from?.pathname || '/app';

  useEffect(() => {
    if (user) navigate(destination, { replace: true });
  }, [destination, navigate, user]);

  const handleGuestLogin = async () => {
    try {
      setError('');
      setGuestLoading(true);
      await continueAsGuest();
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not initialize guest session.');
    } finally {
      setGuestLoading(false);
    }
  };

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
            <h2 className="font-serif text-4xl mt-3">Sign in to ProofPoint</h2>
            <p className="text-sm text-[#5F6A61] mt-3">
              Explore the evidence ledger, upload imagery, and review impact stories.
            </p>

            {/* Quick Demo Access Bypass Button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="w-full py-3.5 px-5 bg-[#2F5D46] hover:bg-[#244A38] text-white font-mono text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {guestLoading ? (
                  <span>Entering Workspace...</span>
                ) : (
                  <>
                    <span>Enter as Guest / Demo Mode</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="font-mono text-[11px] text-[#5F6A61] text-center mt-2">
                Instant access • No credentials required
              </p>
            </div>

            <div className="relative my-8 flex items-center justify-center">
              <div className="border-t border-[#D8D2C4] w-full" />
              <span className="bg-[#F5F2EB] px-3 text-xs font-mono uppercase tracking-wider text-[#5F6A61] absolute">
                Or Google Account
              </span>
            </div>

            {/* Google OAuth Section */}
            {!clientId ? (
              <div className="border border-[#D8D2C4] bg-[#FBF9F4] p-4 text-xs text-[#5F6A61] leading-relaxed">
                Google sign-in is optional. To enable OAuth, add <code className="font-mono text-[11px] bg-[#EDE8DC] px-1 py-0.5">VITE_GOOGLE_CLIENT_ID</code> to client environment.
              </div>
            ) : (
              <div ref={buttonRef} className="min-h-10 flex justify-center" aria-label="Continue with Google" />
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
