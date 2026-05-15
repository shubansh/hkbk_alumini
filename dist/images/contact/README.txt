HOW TO REPLACE THE CONTACT SECTION IMAGE
==========================================

1. Add your new image file to this folder:
   public/images/contact/contact.jpg

   Supported formats: .jpg  .jpeg  .png  .webp
   Recommended size: 1200×900px or 4:3 aspect ratio

2. Open:  src/config/siteImages.js
   Bump the version number (V) by 1, for example:
     const V = 2;   →   const V = 3;

3. Refresh the browser — your new image appears instantly!

The component uses OptimizedImage which provides:
  - Lazy loading
  - Animated skeleton placeholder while loading
  - Automatic fallback (Unsplash image) if contact.jpg is missing
  - Smooth hover zoom effect
  - Gradient overlay for text readability
