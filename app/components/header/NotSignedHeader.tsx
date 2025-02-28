import { Link } from '@remix-run/react';
import { Button } from '@/components/ui/ui/button';
import { useNavigate } from '@remix-run/react';
import { LogIn, Rocket } from 'lucide-react';

export function NotSignedHeader() {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-[#09090B]/95 border-b border-zinc-800 backdrop-blur-lg py-3 px-4 md:px-6 fixed top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="i-bolt:stars text-2xl text-blue-500"></div>
            <span className="font-bold text-white text-xl">Prismium</span>
          </Link>
        </div>

        {/* Navigation - Middle section */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/features" className="text-zinc-400 hover:text-white transition-colors duration-200">
            Features
          </Link>
          <Link to="/pricing" className="text-zinc-400 hover:text-white transition-colors duration-200">
            Pricing
          </Link>
          <Link to="/docs" className="text-zinc-400 hover:text-white transition-colors duration-200">
            Documentation
          </Link>
          <Link to="/blog" className="text-zinc-400 hover:text-white transition-colors duration-200">
            Blog
          </Link>
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center gap-2"
            onClick={() => navigate('/login')}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-500/20"
            onClick={() => navigate('/signup')}
          >
            <Rocket className="w-4 h-4" />
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
