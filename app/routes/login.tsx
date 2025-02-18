import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Label from '@radix-ui/react-label';
import { useNavigate } from '@remix-run/react';
import { useSupabaseAuth } from '~/components/supabase';
import { toast } from 'react-toastify';
import { redirect, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import { createServerClient } from '@supabase/auth-helpers-remix';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('🔍 Login Route: Verificando autenticação...');
  
  const response = new Response();
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL ?? '',
    import.meta.env.SUPABASE_ANON_KEY ?? '',
    { request, response }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (user) {
    console.log('🔄 Login Route: Usuário já logado, verificando se é admin...');
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin) {
      return redirect('/admin', {
        headers: response.headers
      });
    }
    
    return redirect('/', {
      headers: response.headers
    });
  }

  return json(null, {
    headers: response.headers
  });
};

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, loading } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔑 Tentando fazer login com email:', email);

    const { error, data } = await signIn(email, password);
    
    if (error) {
      console.error('❌ Erro no login:', error.message);
      toast.error(error.message || 'Error during login');
    } else {
      console.log('✅ Login bem sucedido! Dados:', data);
      toast.success('Login successful!');
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const { error } = await signUp(email, password, { name });

    if (error) {
      toast.error(error.message || 'Error during sign up');
    } else {
      toast.success('Check your email to confirm your account!');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
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
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-[#111113] border border-zinc-800/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                      placeholder="••••••••"
                      required
                    />
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
                    <input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-[#111113] border border-zinc-800/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label.Root htmlFor="confirm-password" className="text-sm font-medium text-zinc-400">
                      Confirm Password
                    </Label.Root>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-[#111113] border border-zinc-800/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                      placeholder="••••••••"
                      required
                    />
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
