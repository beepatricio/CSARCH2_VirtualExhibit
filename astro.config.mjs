import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import icon from 'astro-icon'; 

export default defineConfig({
  site: "https://beepatricio.github.io",
  base: "/CSARCH2_VirtualExhibit",
  integrations: [mdx(), react(), icon()],
});
