import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        boIntro: 'bo-intro.html',
        policy: 'policy.html',
        bundleCreate: 'bundle-create.html',
        bundleCreate2: 'bundle-create2.html',
        bundleCreate3: 'bundle-create3.html',
        bundleCreate4: 'bundle-create4.html',
        bundleList: 'bundle-list.html',
        displayList: 'display-list.html',
        displayCreate: 'display-create.html',
        productV011: 'product-v011.html',
        productV012: 'product-v012.html',
        productV013: 'product-v013.html',
        productV020: 'product-v020.html',
        productV021: 'product-v021.html',
        productV022: 'product-v022.html',
        displayList2: 'display-list2.html',
        payment1: 'payment1.html',
        payMerchant: 'payment-merchant.html',
        payMerchantProduct: 'payment-merchant-product.html',
        payHistory: 'payment-history.html',
        paySettlement: 'payment-settlement.html',
        payExposure: 'payment-exposure.html',
        payPolicy: 'payment-policy.html',
        paymentMethod2: 'payment-method2.html',
        paymentMethod2Create: 'payment-method2-create.html',
        paymentHistory2: 'payment-history2.html',
        paymentReconciliation2: 'payment-reconciliation2.html',
        productList: 'product-list.html',
        epcList: 'epc-list.html',
        productDisplayBulk: 'product-display-bulk.html',
        productContent: 'product-content.html',
        order1: 'order1.html',
        order1Create: 'order1-create.html',
        order2Create: 'order2-create.html',
        order3Create: 'order3-create.html',
        order4Create: 'order4-create.html',
        orderCornerV21: 'order-corner-v21.html',
        orderCornerCreate: 'order-corner-create.html',
        orderContainerLayout: 'order_container_layout.html',
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
