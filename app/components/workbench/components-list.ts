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
            name: 'Hero with Right Image',
            description: 'Hero section with prominent image on the right and CTA',
            preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
            prompt:
              'Create a modern hero section with:\n- Impactful title and subtitle\n- Image or illustration on the right\n- Primary CTA button\n- Secondary link\n- Gradient background\n- Fully responsive\n- Entry animations\n- Use Tailwind CSS for styling',
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
