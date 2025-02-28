import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Label from '@radix-ui/react-label';
import { useNavigate } from '@remix-run/react';
import { useSupabaseAuth } from '~/components/supabase';
import { redirect, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import { Notification } from '~/components/ui/Notification';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, loading } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null,
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setNotification({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    setNotification({ type: 'info', message: 'Attempting to login...' });
    const { error, data } = await signIn(email, password);

    if (error) {
      switch (error.message) {
        case 'Invalid login credentials':
          setNotification({ type: 'error', message: 'Invalid email or password' });
          break;
        case 'Email not confirmed':
          setNotification({ type: 'error', message: 'Please verify your email before logging in' });
          break;
        case 'Too many requests':
          setNotification({ type: 'error', message: 'Too many login attempts. Please try again later' });
          break;
        default:
          setNotification({ type: 'error', message: 'Login failed. Please try again' });
      }
    } else {
      setNotification({ type: 'success', message: 'Login successful!' });
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword || !name) {
      setNotification({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    if (password.length < 6) {
      setNotification({ type: 'error', message: 'Password must be at least 6 characters long' });
      return;
    }

    if (password !== confirmPassword) {
      setNotification({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setNotification({ type: 'info', message: 'Creating your account...' });
    const { error } = await signUp(email, password, { name });

    if (error) {
      switch (error.message) {
        case 'User already registered':
          setNotification({ type: 'error', message: 'This email is already registered' });
          break;
        case 'Invalid email':
          setNotification({ type: 'error', message: 'Please enter a valid email' });
          break;
        default:
          setNotification({ type: 'error', message: 'Failed to create account. Please try again' });
      }
    } else {
      setNotification({ type: 'success', message: 'Account created successfully! Please check your email.' });
      navigate('/verify-email');
    }
  };

  const togglePassword = () => setShowPassword(!showPassword);
  const toggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Notification
        show={notification !== null}
        type={notification?.type || 'info'}
        message={notification?.message || ''}
        onClose={() => setNotification(null)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
        {/* Left Column - Form */}
        <div className="flex items-center justify-center p-8 bg-[#09090B]">
          <div className="w-full max-w-md space-y-6">
            <Tabs.Root defaultValue="login" className="w-full" orientation="horizontal">
              <Tabs.List
                aria-label="Manage your account"
                className="relative w-full mb-6 bg-[#09090B] p-1 rounded-lg border border-zinc-800/60"
              >
                <div className="grid w-full grid-cols-2 gap-1">
                  <Tabs.Trigger value="login" className="tabs-trigger">
                    <span className="relative z-10">Login</span>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="register" className="tabs-trigger">
                    <span className="relative z-10">Sign Up</span>
                  </Tabs.Trigger>
                </div>
              </Tabs.List>

              {/* Login Form */}
              <Tabs.Content value="login" className="tabs-content rounded-lg">
                <div className="space-y-2 text-center mb-8">
                  <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                  <p className="text-zinc-400">Enter your credentials to access your account</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label.Root htmlFor="login-email" className="text-sm font-medium text-zinc-400">
                      Email
                    </Label.Root>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-[#111113] border border-zinc-800/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label.Root htmlFor="login-password" className="text-sm font-medium text-zinc-400">
                      Password
                    </Label.Root>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 bg-[#111113] border border-zinc-800/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePassword}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white bg-transparent"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {loading ? 'Loading...' : 'Sign In'}
                  </button>
                  <div className="text-center">
                    <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">
                      Forgot your password?
                    </a>
                  </div>
                </form>
              </Tabs.Content>

              {/* Registration Form */}
              <Tabs.Content value="register" className="tabs-content rounded-lg">
                <div className="space-y-2 text-center mb-8">
                  <h1 className="text-2xl font-bold text-white">Create your account</h1>
                  <p className="text-zinc-400">Fill in the fields below to get started</p>
                </div>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label.Root htmlFor="register-name" className="text-sm font-medium text-zinc-400">
                      Full name
                    </Label.Root>
                    <input
                      id="register-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-[#111113] border border-zinc-800/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label.Root htmlFor="register-email" className="text-sm font-medium text-zinc-400">
                      Email
                    </Label.Root>
                    <input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-[#111113] border border-zinc-800/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label.Root htmlFor="register-password" className="text-sm font-medium text-zinc-400">
                      Password
                    </Label.Root>
                    <div className="relative">
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 bg-[#111113] border border-zinc-800/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePassword}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white bg-transparent"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label.Root htmlFor="confirm-password" className="text-sm font-medium text-zinc-400">
                      Confirm Password
                    </Label.Root>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 bg-[#111113] border border-zinc-800/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPassword}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white bg-transparent"
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {loading ? 'Loading...' : 'Create Account'}
                  </button>
                </form>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>

        {/* Right Column - Hero */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-blue-500/20 relative">
          <div></div>
          <div className="self-end">
            <blockquote className="space-y-2 text-right">
              <p className="text-lg text-white/90">"Turn your ideas into reality with our platform."</p>
              <footer className="text-sm text-white/70">- Development Team</footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
