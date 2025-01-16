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
          },
          {
            id: 'hero-gradient',
            name: 'Hero with Gradient Background',
            description: 'Modern hero section with gradient background and floating elements',
            preview: 'https://images.unsplash.com/photo-1579547944212-c4f4961a8dd8',
            prompt:
              'Create a modern hero section with:\n- Impactful title and subtitle\n- Gradient background\n- Floating elements\n- Primary CTA button\n- Secondary link\n- Fully responsive\n- Entry animations\n- Use Tailwind CSS for styling',
          },
          {
            id: 'hero-centered',
            name: 'Centered Hero',
            description: 'Hero section with centered content and soft gradient',
            preview: 'https://images.unsplash.com/photo-1579547944212-c4f4961a8dd8',
            prompt:
              'Create a modern hero section with:\n- Impactful title and subtitle\n- Centered content\n- Soft gradient background\n- Primary CTA button\n- Secondary link\n- Fully responsive\n- Entry animations\n- Use Tailwind CSS for styling',
          },
          {
            id: 'hero-split',
            name: 'Split Hero',
            description: 'Hero section divided into two columns with image',
            preview: 'https://images.unsplash.com/photo-1579547944212-c4f4961a8dd8',
            prompt:
              'Create a modern hero section with:\n- Impactful title and subtitle\n- Image or illustration on the left\n- Content on the right\n- Primary CTA button\n- Secondary link\n- Fully responsive\n- Entry animations\n- Use Tailwind CSS for styling',
          },
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
Here’s the exact code to implement this:


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

      nav: {
        name: 'Navigation',
        icon: 'i-ph:list-duotone',
        components: [
          {
            id: 'navbar-centered-logo',
            name: 'Navbar with Centered Logo',
            description: 'Navigation bar with centered logo and side menus',
            preview: 'https://images.unsplash.com/photo-1481487196290-c152efe083f5',
            prompt:
              'Create a navigation bar with:\n- Centered logo\n- Side menus\n- Navigation links\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover effects on links',
          },
          {
            id: 'navbar-dropdown',
            name: 'Navbar with Dropdown',
            description: 'Navigation bar with dropdown menus and integrated search',
            preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
            prompt:
              'Create a navigation bar with:\n- Dropdown menu\n- Integrated search\n- Navigation links\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover effects on links',
            isNew: true,
          },
        ],
      },
      footer: {
        name: 'Footer',
        icon: 'i-ph:dots-three-outline-duotone',
        components: [
          {
            id: 'footer-newsletter',
            name: 'Footer with Newsletter',
            description: 'Footer with newsletter form and links',
            preview: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
            prompt:
              'Create a footer with:\n- Newsletter form\n- Navigation links\n- Social media icons\n- Copyright at the bottom\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover effects on links',
          },
          {
            id: 'footer-multi-column',
            name: 'Multi-column Footer',
            description: 'Footer organized into multiple columns of links',
            preview: 'https://images.unsplash.com/photo-1579547945413-497e1b99dac0',
            prompt:
              'Create a footer with:\n- Multiple columns of links\n- Social media icons\n- Copyright at the bottom\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover effects on links',
          },
        ],
      },
      testimonials: {
        name: 'Testimonials',
        icon: 'i-ph:chat-circle-text-duotone',
        components: [
          {
            id: 'testimonial-carousel',
            name: 'Testimonials Carousel',
            description: 'Slider with testimonial cards',
            preview: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7',
            prompt:
              'Create a testimonials carousel with:\n- Testimonial cards\n- Navigation between testimonials\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover effects on cards',
          },
          {
            id: 'testimonial-grid',
            name: 'Testimonials Grid',
            description: 'Responsive grid with testimonials and photos',
            preview: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
            prompt:
              'Create a testimonials grid with:\n- Testimonials and photos\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover effects on testimonials',
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
        components: [
          {
            id: 'gradient-buttons',
            name: 'Gradient Buttons',
            description: 'Collection of buttons with modern gradient effects',
            preview: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc',
            prompt:
              'Create a collection of buttons with:\n- Modern gradient effects\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover effects on buttons',
          },
          {
            id: 'icon-buttons',
            name: 'Icon Buttons',
            description: 'Interactive buttons with icons and animations',
            preview: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
            prompt:
              'Create interactive buttons with:\n- Icons and animations\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover effects on buttons',
            isNew: true,
          },
        ],
      },
      cards: {
        name: 'Cards',
        icon: 'i-ph:cards-duotone',
        components: [
          {
            id: 'hover-cards',
            name: 'Hover Cards',
            description: 'Cards with elegant hover effects',
            preview: 'https://images.unsplash.com/photo-1557821552-17105176677c',
            prompt:
              'Create cards with:\n- Elegant hover effects\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover animations',
          },
          {
            id: 'info-cards',
            name: 'Info Cards',
            description: 'Cards for displaying information and statistics',
            preview: 'https://images.unsplash.com/photo-1557821552-17105176677c',
            prompt:
              'Create info cards with:\n- Information and statistics display\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include hover animations',
          },
        ],
      },
      sidebar: {
        name: 'Sidebar',
        icon: 'i-ph:list-duotone',
        components: [
          {
            id: 'sidebar-with-dropdown',
            name: 'Sidebar with Dropdown',
            description: 'Sidebar with dropdown menus and integrated search',
            preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
            prompt:
              `Prompt: Install and Use a Sidebar Component with Skeleton and Dark Mode Support
Objective:

Create a fully functional Sidebar component with a collapsible design, skeleton loading states, and dark mode support. The Sidebar should include navigation links, icons, and a user profile section. It should be integrated into a Vite + React + TypeScript project.

Steps to Implement:
Install Dependencies:
Ensure the following dependencies are installed in your project:


npm install framer-motion lucide-react react-router-dom
Create the Sidebar Component:

Create a sidebar.tsx file in the src/components/ui/ folder.
Add the following code to implement the Sidebar with collapsible functionality, skeleton loading, and dark mode support.
Create the Sidebar Demo Component:

Create a sidebar.demo.tsx file in the src/components/ui/ folder.
Add the demo code to showcase the Sidebar with navigation links, icons, and a user profile section.
Integrate the Sidebar into Your App:

Update App.tsx to include the Sidebar and Hero components side by side.
Fix the React Router Context:

Wrap your app with BrowserRouter in main.tsx to ensure proper routing context.
Adjust Sidebar Width and Hover Behavior:

Ensure the Sidebar has a fixed width when collapsed and expanded.
Fix the hover behavior to expand and collapse the Sidebar correctly.
Run the Project:
Start the development server to see the Sidebar in action:


npm run dev
Complete Code:
1. main.tsx:

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
2. sidebar.tsx:

"use client";

import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[60px] hover:w-[300px] transition-all duration-300 ease-in-out flex-shrink-0",
        className
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
3. sidebar.demo.tsx:

"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, UserCog, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SidebarDemo() {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 max-w-7xl mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Manu Arora",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 flex-shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      to="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Acet Labs
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      to="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};
4. App.tsx:

import React from "react";
import { Hero1 } from "@/components/ui/hero-with-text-and-two-button";
import { SidebarDemo } from "@/components/ui/sidebar.demo";

function App() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <SidebarDemo />
      </div>

      {/* Hero */}
      <div className="flex-1">
        <Hero1 />
      </div>
    </div>
  );
}

export default App;
Expected Result:
A collapsible Sidebar with navigation links, icons, and a user profile section.
The Sidebar supports dark mode and skeleton loading states.
The Sidebar is positioned on the left with a fixed width when collapsed and expands on hover.
The Hero component is displayed on the right.
Run npm run dev to see the Sidebar in action! 🚀`,
            isNew: true,
          },
        ],
      },

      forms: {
        name: 'Forms',
        icon: 'i-ph:text-columns-duotone',
        components: [
          {
            id: 'validation-form',
            name: 'Form with Validation',
            description: 'Form with real-time validation',
            preview: 'https://images.unsplash.com/photo-1557821552-17105176677c',
            prompt:
              'Create a form with:\n- Real-time validation\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include field animations',
          },
          {
            id: 'multi-step-form',
            name: 'Multi-step Form',
            description: 'Form divided into multiple steps',
            preview: 'https://images.unsplash.com/photo-1557821552-17105176677c',
            prompt:
              'Create a multi-step form with:\n- Multiple steps\n- Progress indicator\n- Responsive on all screens\n- Use Tailwind CSS for styling\n- Include smooth transitions',
            isNew: true,
          },
        ],
      },
    },
  },
};
