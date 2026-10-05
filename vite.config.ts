import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        policy: 'policy.html',
        bundleCreate: 'bundle-create.html',
        bundleCreate2: 'bundle-create2.html',
        bundleCreate3: 'bundle-create3.html',
        bundleCreate4: 'bundle-create4.html',
        bundleList: 'bundle-list.html',
        displayList: 'display-list.html',
        displayCreate: 'display-create.html',
        productCreate: 'product-create.html',
        productCreate2: 'product-create2.html',
        productCreate3: 'product-create3.html',
        payment1: 'payment1.html',
        payMerchant: 'payment-merchant.html',
        payMerchantProduct: 'payment-merchant-product.html',
        payHistory: 'payment-history.html',
        paySettlement: 'payment-settlement.html',
        payExposure: 'payment-exposure.html',
        payPolicy: 'payment-policy.html',
        productList: 'product-list.html',
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4000',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://127.0.0.1:4000',
    },
  },
});
