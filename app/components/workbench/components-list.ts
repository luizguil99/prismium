// List of components organized by category and subcategory
export type Component = {
  id: string;
  name: string;
  description?: string;
  preview?: string;
  isNew?: boolean;
  prompt: string; // Prompt for component generation
};

export type Subcategory = {
  name: string;
  icon?: string;
  components: Component[];
};

export type Category = {
  name: string;
  icon: string;
  subcategories: Record<string, Subcategory>;
};

export const categories: Record<string, Category> = {
  landingPages: {
    name: 'Landing Pages',
    icon: 'i-ph:browser-duotone',
    subcategories: {
      hero: {
        name: 'Hero',
        icon: 'i-ph:layout-duotone',
        components: [
          {
            id: 'hero-right-image',
            name: 'Hero with text and two button',
            description: 'Hero section with black dots',
            preview: '/Hero-with-text-2-button.png',
            prompt: `Complete Prompt:

Objective: Create a Hero component with a black background and white dots, featuring styled text and buttons that match the dark theme.

Steps:

Create the Hero Component:

The background should be black (bg-black) with a white dot pattern using a radial gradient (bg-[radial-gradient(#ffffff33_1px,#000000_1px)]).

The main text should be white (text-white), and the secondary text should have reduced opacity (text-white/70).

Buttons should have styles that match the dark theme:

Primary button: white background with black text (bg-white text-black).

Secondary button: transparent background with a white border (bg-transparent border-white/20).

Component Structure:

A large centered title (text-5xl md:text-7xl).

A descriptive paragraph below the title (text-lg md:text-xl).

Two main buttons: one for the primary action and another for the secondary action.

Colors and Styles:

Background: bg-black bg-[radial-gradient(#ffffff33_1px,#000000_1px)] bg-[size:20px_20px].

Main text: text-white.

Secondary text: text-white/70.

Primary button: bg-white text-black hover:bg-white/90.

Secondary button: bg-transparent border-white/20 hover:bg-white/10 text-white.

Dependencies:

Use the Button component from Shadcn UI.

Use icons from lucide-react for the buttons.

Rendering:

Render the component in App.tsx.

Complete Code:

// src/components/ui/hero-with-text-and-two-button.tsx
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button"

function Hero1() {
  return (
    <div className="w-full bg-black bg-[radial-gradient(#ffffff33_1px,#000000_1px)] bg-[size:20px_20px]">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4 bg-white/10 hover:bg-white/20 text-white">
              Read our launch article <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular text-white">
              This is the start of something new
            </h1>
            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-white/70 max-w-2xl text-center">
              Managing a small business today is already tough. Avoid further
              complications by ditching outdated, tedious trade methods. Our goal
              is to streamline SMB trade, making it easier and faster than ever.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4 bg-transparent border-white/20 hover:bg-white/10 text-white" variant="outline">
              Jump on a call <PhoneCall className="w-4 h-4" />
            </Button>
            <Button size="lg" className="gap-4 bg-white text-black hover:bg-white/90">
              Sign up here <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero1 };


// src/App.tsx
import React from "react";
import { Hero1 } from "@/components/ui/hero-with-text-and-two-button";

function App() {
  return (
    <div>
      <Hero1 />
    </div>
  );
}

export default App;


Execution Instructions:

Create the above files in your project.

Ensure the dependencies (lucide-react, @radix-ui/react-slot, class-variance-authority) are installed.

Run npm run dev to view the component.

Expected Result:

A black background with white dots.

White text with adjusted opacity.

Buttons styled to match the dark theme.

Icons in the buttons to improve usability.

Now you have a modern and styled Hero component! 🚀`,
            isNew: true,
          }
        ],
      },
      login: {
        name: 'Login',
        icon: 'i-ph:lock-simple-duotone',
        components: [
          {
            id: 'login-page',
            name: 'Login Page',
            description: 'Simple login page with email and password inputs',
            preview: '/login-page.png',
            prompt:
              `Create a login/registration form exactly as in the provided example, with the following features:

Layout:

Split-screen layout (50% each)
Left column with gradient background (indigo-600 to purple-600)
Right column with a centered form
Responsive: Left column hidden on small screens
Animations:

Use Framer Motion for smooth animations
Left column fades in from the left
Right column fades in from the right
Form fades in on load
Form Components:

Tabs for switching between Login and Register
Input fields with icons (Mail, Lock, User from Lucide React)
Gradient button with hover effects
Forgot password link below the login form
Styling:

Use Tailwind CSS for styling
Gradient backgrounds and shadows
Consistent spacing and typography
Rounded corners and smooth transitions
Functionality:

State management for email, password, and name fields
Form submission handling
Console log for form data on submit
Dependencies:

Use @radix-ui/react-tabs for tab functionality
Use lucide-react for icons
Use framer-motion for animations
Here's the exact code to implement this:


'use client'

import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Mail, Lock, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm({ isRegister }: { isRegister: boolean }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isRegister ? 'Register' : 'Login', { email, password, name });
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isRegister && (
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="pl-10"
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
        {isRegister ? 'Create Account' : 'Sign In'}
      </Button>
      {!isRegister && (
        <p className="text-center text-sm text-gray-600 mt-4">
          <a href="#" className="text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">Forgot your password?</a>
        </p>
      )}
    </motion.form>
  );
}

export default function App() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden w-1/2 bg-gradient-to-br from-indigo-600 to-purple-600 lg:flex flex-col justify-between p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L50 100 L100 0 Z" fill="white" />
          </svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-white text-5xl font-bold mb-4">Welcome Back</h2>
          <p className="text-indigo-200 text-xl">
            Your journey to productivity starts here.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-indigo-200 text-lg italic">
            "The secret of getting ahead is getting started."
          </p>
          <p className="text-indigo-300 mt-2">- Mark Twain</p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-indigo-800">Account Access</h1>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm isRegister={false} />
            </TabsContent>
            <TabsContent value="register">
              <LoginForm isRegister={true} />
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
Dependencies to Install:


npm install @radix-ui/react-tabs lucide-react framer-motion
Features Included:

Split-screen layout with gradient background
Smooth animations with Framer Motion
Responsive design (left column hidden on small screens)
Tabs for Login and Register
Input fields with icons
Gradient button with hover effects
Forgot password link
Form state management and submission handling
This code will create the exact form as in the project. Copy and paste it into your App.tsx or a new component, and it will work seamlessly! Don't forget to add the necessary files in case they don't exist`,
            isNew: true,
          },
          {
            id: 'Login with phrase',
            name: 'Login Page with Phrase',
            description: 'Login page with social media login options',
            preview: '/login-2.png',
            prompt:
              `import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
        {/* Left Column */}
        <div className="hidden lg:flex flex-col justify-end p-8 bg-gradient-to-b from-primary/10 to-primary/30">
          <blockquote className="space-y-2">
            <p className="text-lg text-primary/80">
              &ldquo;Turn your ideas into reality with our platform.&rdquo;
            </p>
            <footer className="text-sm text-primary/60">
              - Development Team
            </footer>
          </blockquote>
        </div>

        {/* Right Column */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-muted-foreground">
                    Enter your credentials to access your account
                  </p>
                </div>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="your@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required />
                  </div>
                  <Button className="w-full" type="submit">
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              {/* Registration Form */}
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-bold">Create your account</h1>
                  <p className="text-muted-foreground">
                    Fill in the fields below to register
                  </p>
                </div>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="Your name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" required />
                  </div>
                  <Button className="w-full" type="submit">
                    Register
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
don't forget to add the necessary files and dependencies and make sure the tabs work`,
            isNew: true,
          },
        ],
      },
    },
  },
  uiElements: {
    name: 'UI Elements',
    icon: 'i-ph:stack-duotone',
    subcategories: {
      buttons: {
        name: 'Buttons',
        icon: 'i-ph:cursor-click-duotone',
        components: [],
      },
      cards: {
        name: 'Cards',
        icon: 'i-ph:cards-duotone',
        components: [],
      },
      sidebar: {
        name: 'Sidebar',
        icon: 'i-ph:list-duotone',
        components: [],
      },
      forms: {
        name: 'Forms',
        icon: 'i-ph:text-columns-duotone',
        components: [],
      }
    },
  },
};
