import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
const base = process.env.BASE_PATH ? `/${process.env.BASE_PATH.replace(/^\/+|\/+$/g, '')}/` : '/'
export default defineConfig({base, plugins: [react(), VitePWA({registerType:'prompt', includeAssets:['icon.svg','apple-touch-icon.png'], manifest:{id:base, name:'Powerlevel',short_name:'Powerlevel',description:'Your strength, transformed. Your consistency, ranked.', start_url:base, scope:base, display:'standalone', background_color:'#080c16',theme_color:'#080c16', icons:[{src:`${base}icon-192.png`,sizes:'192x192',type:'image/png',purpose:'any'},{src:`${base}icon-512.png`,sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{html,js,css,png,webp,svg,woff2}'],maximumFileSizeToCacheInBytes:5000000,cleanupOutdatedCaches:true,navigateFallback:'index.html'}})]})
