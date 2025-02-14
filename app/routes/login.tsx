import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Label from '@radix-ui/react-label';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
        {/* Left Column - Form */}
        <div className="flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-6">
            <Tabs.Root defaultValue="login" className="w-full" orientation="horizontal">
              <Tabs.List 
                aria-label="Manage your account" 
                className="relative w-full mb-6 bg-gray-100 p-1 rounded-lg"
              >
                <div className="grid w-full grid-cols-2 gap-1">
                  <Tabs.Trigger 
                    value="login"
                    className="relative px-3 py-2.5 text-sm font-medium text-gray-600 outline-none transition-all rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
                  >
                    <span className="relative z-10">Login</span>
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="register"
                    className="relative px-3 py-2.5 text-sm font-medium text-gray-600 outline-none transition-all rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
                  >
                    <span className="relative z-10">Sign Up</span>
                  </Tabs.Trigger>
                </div>
              </Tabs.List>

              {/* Login Form */}
              <Tabs.Content 
                value="login" 
                className="outline-none rounded-lg data-[state=inactive]:hidden"
              >
                <div className="space-y-2 text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                  <p className="text-gray-600">
                    Enter your credentials to access your account
                  </p>
                </div>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label.Root htmlFor="login-email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label.Root>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label.Root htmlFor="login-password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label.Root>
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-black hover:bg-gray-900 transition-all duration-200"
                  >
                    Sign In
                  </button>
                  <div className="text-center">
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
                      Forgot your password?
                    </a>
                  </div>
                </form>
              </Tabs.Content>

              {/* Registration Form */}
              <Tabs.Content 
                value="register" 
                className="outline-none rounded-lg data-[state=inactive]:hidden"
              >
                <div className="space-y-2 text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                  <p className="text-gray-600">
                    Fill in the fields below to get started
                  </p>
                </div>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label.Root htmlFor="register-name" className="text-sm font-medium text-gray-700">
                      Full name
                    </Label.Root>
                    <input
                      id="register-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label.Root htmlFor="register-email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label.Root>
                    <input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label.Root htmlFor="register-password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label.Root>
                    <input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-black hover:bg-gray-900 transition-all duration-200"
                  >
                    Create Account
                  </button>
                </form>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>

        {/* Right Column - Hero */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gray-100 relative">
          <div></div>
          <div className="self-end">
            <blockquote className="space-y-2 text-right">
              <p className="text-lg text-gray-600">
                "Turn your ideas into reality with our platform."
              </p>
              <footer className="text-sm text-gray-500">
                - Development Team
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}