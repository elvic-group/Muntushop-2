// Service Handler
// Handles service-specific conversation flows

const ConversationManager = require('./conversationManager');
const services = require('../templates/whatsapp/allServices');
const PaymentService = require('./paymentService');
const ProductService = require('./productService');
const OrderService = require('./orderService');
const UserService = require('./userService');
const MobileMoneyService = require('./mobileMoneyService');
const pool = require('../backend/src/config/database');

class ServiceHandler {
  /**
   * Handle service selection from main menu
   */
  static handleServiceSelection(phoneNumber, serviceNumber) {
    const serviceMap = {
      1: { name: 'shopping', display: 'Shopping Store' },
      2: { name: 'messaging', display: 'Bulk Messaging' },
      3: { name: 'support', display: 'Customer Support' },
      4: { name: 'appointments', display: 'Appointments' },
      5: { name: 'groups', display: 'Group Management' },
      6: { name: 'money', display: 'Money Assistant' },
      7: { name: 'courses', display: 'Online Courses' },
      8: { name: 'news', display: 'News & Updates' },
      9: { name: 'marketing', display: 'Marketing Services' },
      10: { name: 'b2b', display: 'B2B Wholesale' },
      11: { name: 'iptv', display: 'IPTV Subscriptions' }
    };

    const service = serviceMap[serviceNumber];
    if (!service) return null;

    // Set user's current service
    ConversationManager.setService(phoneNumber, service.name, 'menu');

    // Return service menu
    return services[service.name].menu();
  }

  /**
   * Handle message within a service context
   */
  static handleServiceMessage(phoneNumber, message, currentService) {
    const msg = message.toLowerCase().trim();

    // Handle "0" or "back" - return to main menu
    if (msg === '0' || msg === 'back' || msg === 'main menu') {
      ConversationManager.clearState(phoneNumber);
      const menus = require('../templates/whatsapp/menus');
      return menus.mainMenu();
    }

    // Route to specific service handler
    switch (currentService) {
      case 'shopping':
        return this.handleShopping(phoneNumber, message);
      case 'messaging':
        return this.handleMessaging(phoneNumber, message);
      case 'support':
        return this.handleSupport(phoneNumber, message);
      case 'appointments':
        return this.handleAppointments(phoneNumber, message);
      case 'groups':
        return this.handleGroups(phoneNumber, message);
      case 'money':
        return this.handleMoney(phoneNumber, message);
      case 'courses':
        return this.handleCourses(phoneNumber, message);
      case 'news':
        return this.handleNews(phoneNumber, message);
      case 'marketing':
        return this.handleMarketing(phoneNumber, message);
      case 'b2b':
        return this.handleB2B(phoneNumber, message);
      case 'iptv':
        return this.handleIPTV(phoneNumber, message);
      default:
        return null;
    }
  }

  /**
   * Shopping Service Handler
   */
  static async handleShopping(phoneNumber, message) {
    const state = ConversationManager.getUserState(phoneNumber);
    const msg = message.trim();

    // Main shopping menu
    if (state.currentStep === 'menu') {
      switch (msg) {
        case '1': // Phone Accessories
          ConversationManager.updateUserState(phoneNumber, { currentStep: 'phone-accessories' });
          return services.shopping.phoneAccessories();

        case '2': // Fashion
          ConversationManager.updateUserState(phoneNumber, { currentStep: 'fashion' });
          return services.shopping.fashion();

        case '3': // Electronics
          ConversationManager.updateUserState(phoneNumber, { currentStep: 'electronics' });
          return services.shopping.electronics();

        case '4': // Home & Living
          ConversationManager.updateUserState(phoneNumber, { currentStep: 'home-living' });
          return services.shopping.homeAndLiving();

        case '5': // Games & Toys
          ConversationManager.updateUserState(phoneNumber, { currentStep: 'games-toys' });
          return services.shopping.gamesAndToys();

        case '6': { // View Cart
          try {
            const user = await UserService.getOrCreateUser(phoneNumber);
            const cart = await UserService.getCart(user.id);

            if (!cart.items || cart.items.length === 0) {
              return services.shopping.emptyCart();
            }

            // Get product details for cart items
            const cartItems = await Promise.all(
              cart.items.map(async (item) => {
                const product = await ProductService.getProductById(item.productId);
                return {
                  name: product.name,
                  price: product.price,
                  quantity: item.quantity,
                  subtotal: product.price * item.quantity
                };
              })
            );

            return services.shopping.cart(cartItems, cart.total);
          } catch (error) {
            console.error('Cart error:', error);
            return services.shopping.emptyCart();
          }
        }

        case '7': { // My Orders
          try {
            const user = await UserService.getOrCreateUser(phoneNumber);
            const orders = await OrderService.getUserOrders(user.id);

            if (orders.length === 0) {
              return `📦 MY ORDERS\n\nYou don't have any orders yet.\n\n1️⃣  Start Shopping\n0️⃣  Main Menu\n\nReply with number`;
            }

            let ordersText = `📦 YOUR ORDERS\n\n`;
            orders.slice(0, 5).forEach((order, i) => {
              ordersText += `${i + 1}. Order #${order.order_number}\n`;
              ordersText += `   Status: ${order.status}\n`;
              ordersText += `   Total: $${order.total}\n`;
              ordersText += `   Date: ${new Date(order.created_at).toLocaleDateString()}\n\n`;
            });

            ordersText += `Type TRACK <order_number> to track\n0️⃣  Main Menu`;
            return ordersText;
          } catch (error) {
            console.error('Orders error:', error);
            return `📦 MY ORDERS\n\nError loading orders.\n\n0️⃣  Main Menu`;
          }
        }

        case '8': { // Search
          ConversationManager.updateUserState(phoneNumber, { currentStep: 'search' });
          return `🔍 SEARCH PRODUCTS\n\nType product name to search:\n\nExample: "phone case" or "t-shirt"\n\nType 0 for Main Menu`;
        }

        default:
          return services.shopping.menu();
      }
    }

    // Search mode
    if (state.currentStep === 'search') {
      if (msg === '0') {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'menu' });
        return services.shopping.menu();
      }

      try {
        const products = await ProductService.searchProducts(msg);

        if (products.length === 0) {
          return `🔍 NO RESULTS\n\nNo products found for "${msg}"\n\nTry different keywords\n\n0️⃣  Main Menu`;
        }

        let resultsText = `🔍 SEARCH RESULTS for "${msg}"\n\n`;
        products.slice(0, 5).forEach((product, i) => {
          resultsText += `${i + 1}. ${product.name}\n`;
          resultsText += `   $${product.price} ⭐ ${product.rating}/5\n\n`;
        });

        resultsText += `Reply with number for details\n0️⃣  Main Menu`;

        // Store products in context
        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'search-results',
          context: { searchResults: products.slice(0, 5) }
        });

        return resultsText;
      } catch (error) {
        console.error('Search error:', error);
        return `⚠️ Search error. Please try again.\n\n0️⃣  Main Menu`;
      }
    }

    // Search results - product selection
    if (state.currentStep === 'search-results') {
      if (msg === '0') {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'menu' });
        return services.shopping.menu();
      }

      const index = parseInt(msg) - 1;
      const products = state.context?.searchResults || [];

      if (index >= 0 && index < products.length) {
        const product = products[index];
        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'product-detail',
          context: { selectedProduct: product }
        });
        return services.shopping.productDetail({
          name: product.name,
          price: product.price,
          rating: product.rating,
          reviews: product.reviews_count,
          description: product.description
        });
      }
    }

    // In category view
    if (['phone-accessories', 'fashion', 'electronics', 'home-living', 'games-toys'].includes(state.currentStep)) {
      if (msg === '0') {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'menu' });
        return services.shopping.menu();
      }

      // Product selection - get from database
      if (/^[1-5]$/.test(msg)) {
        try {
          const categoryMap = {
            'phone-accessories': 'Phone Accessories',
            'fashion': 'Fashion',
            'electronics': 'Electronics',
            'home-living': 'Home & Living',
            'games-toys': 'Games & Toys'
          };

          const category = categoryMap[state.currentStep];
          const products = await ProductService.getProductsByCategory(category);

          const index = parseInt(msg) - 1;
          if (index >= 0 && index < products.length) {
            const product = products[index];
            ConversationManager.updateUserState(phoneNumber, {
              currentStep: 'product-detail',
              context: { selectedProduct: product }
            });
            return services.shopping.productDetail({
              name: product.name,
              price: product.price,
              rating: product.rating,
              reviews: product.reviews_count,
              description: product.description
            });
          }
        } catch (error) {
          console.error('Product selection error:', error);
          return `⚠️ Error loading product. Please try again.\n\n0️⃣  Back`;
        }
      }
    }

    // Product detail view
    if (state.currentStep === 'product-detail') {
      const product = state.context?.selectedProduct;

      if (msg === '1') { // Add to cart
        try {
          const user = await UserService.getOrCreateUser(phoneNumber);
          await UserService.addToCart(user.id, product.id, 1);
          const cart = await UserService.getCart(user.id);

          ConversationManager.updateUserState(phoneNumber, {
            currentStep: 'cart',
            context: { ...state.context }
          });

          return services.shopping.addedToCart(product.name, cart.total);
        } catch (error) {
          console.error('Add to cart error:', error);
          return `⚠️ Error adding to cart. Please try again.\n\n0️⃣  Back`;
        }
      }

      if (msg === '2') { // View reviews
        return `⭐ REVIEWS\n\n"Great quality!" - John ⭐⭐⭐⭐⭐\n"Worth every penny" - Mary ⭐⭐⭐⭐⭐\n"Excellent!" - Peter ⭐⭐⭐⭐⭐\n\n0️⃣  Back\n\nReply with number`;
      }

      if (msg === '0') {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'menu' });
        return services.shopping.menu();
      }
    }

    // Cart view - checkout flow
    if (state.currentStep === 'cart') {
      if (msg === '1') { // Proceed to checkout
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'checkout' });
        return `📦 CHECKOUT\n\n📍 Enter your delivery address:\n\nExample:\n123 Main St, Apt 4B\nNairobi, Kenya\n\nType your address:`;
      }

      if (msg === '2') { // Continue shopping
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'menu' });
        return services.shopping.menu();
      }

      if (msg === '0') {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'menu' });
        return services.shopping.menu();
      }
    }

    // Checkout - collect address
    if (state.currentStep === 'checkout') {
      if (msg === '0') {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'cart' });
        const cart = state.context?.cart || [];
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const cartItems = cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: 1,
          subtotal: item.price
        }));
        return services.shopping.cart(cartItems, total);
      }

      // Save address and show payment method selection
      const user = await UserService.getOrCreateUser(phoneNumber);
      const cart = await UserService.getCart(user.id);

      // Get available payment methods (only shows configured ones)
      const availableMethods = MobileMoneyService.getAvailablePaymentMethods();

      ConversationManager.updateUserState(phoneNumber, {
        currentStep: 'select-payment-method',
        context: { ...state.context, deliveryAddress: message, availableMethods }
      });

      // Generate dynamic menu based on available methods
      const total = parseFloat(cart.total) || 0;
      let menu = `\n💳 SELECT PAYMENT METHOD\n\nOrder Total: $${total.toFixed(2)}\n\nChoose your payment method:\n\n`;

      availableMethods.forEach((method, index) => {
        const num = index + 1;
        if (method.id === 'stripe') {
          menu += `${num}️⃣  ${method.icon}  ${method.name} - Instant\n    Visa, Mastercard, Amex\n\n`;
        } else if (method.id === 'mpesa') {
          menu += `${num}️⃣  ${method.icon}  ${method.name} (Kenya)\n    KES ${Math.ceil(total * 130)}\n\n`;
        } else if (method.id === 'orange') {
          menu += `${num}️⃣  ${method.icon}  ${method.name}\n    XOF ${Math.ceil(total * 655)}\n\n`;
        } else if (method.id === 'tigo') {
          menu += `${num}️⃣  ${method.icon}  ${method.name} (Tanzania)\n    TZS ${Math.ceil(total * 2300)}\n\n`;
        }
      });

      menu += `0️⃣  ⬅️  Back\n\nReply with number\n\n💡 All methods are secure and instant!`;

      return menu;
    }

    // Payment method selection
    if (state.currentStep === 'select-payment-method') {
      if (msg === '0') {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'checkout' });
        return `📦 CHECKOUT\n\n📍 Enter your delivery address:`;
      }

      // Get available methods from context
      const availableMethods = state.context?.availableMethods || MobileMoneyService.getAvailablePaymentMethods();
      const selectedIndex = parseInt(msg) - 1;

      if (selectedIndex >= 0 && selectedIndex < availableMethods.length) {
        const selectedMethod = availableMethods[selectedIndex].id;

        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'payment',
          context: { ...state.context, paymentMethod: selectedMethod }
        });

        // Different prompts based on payment method
        if (selectedMethod === 'stripe') {
          return `✅ Stripe Card Payment selected!\n\n📧 Enter your email for receipt:\n\nExample: john@example.com`;
        } else {
          return `✅ ${availableMethods[selectedIndex].name} selected!\n\n📱 Enter your phone number:\n\nExample: +254712345678 (M-Pesa)\nExample: +221761234567 (Orange)\nExample: +255712345678 (Tigo)\n\nType phone number:`;
        }
      }

      return `Invalid selection. Please choose a valid option.`;
    }

    // Payment - create order and process payment
    if (state.currentStep === 'payment') {
      if (msg === '0') {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'checkout' });
        return `📦 CHECKOUT\n\n📍 Enter your delivery address:`;
      }

      try {
        // Get user and cart from database
        const user = await UserService.getOrCreateUser(phoneNumber);
        const cart = await UserService.getCart(user.id);

        if (!cart.items || cart.items.length === 0) {
          return `⚠️ Your cart is empty.\n\n1️⃣  Start Shopping\n0️⃣  Main Menu`;
        }

        // Get cart items with product details
        const cartItems = await Promise.all(
          cart.items.map(async (item) => {
            const product = await ProductService.getProductById(item.productId);
            return {
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: item.quantity
            };
          })
        );

        const total = cart.total;
        const orderNumber = `ORD${Date.now()}`;
        const paymentMethod = state.context?.paymentMethod || 'stripe';

        // For Stripe, message is email; for mobile money, it's phone number
        const customerContact = message;
        const customerPhone = paymentMethod === 'stripe' ? phoneNumber : message;

        // Create order in database (pending payment)
        const order = await OrderService.createOrder(user.id, {
          orderNumber,
          items: cartItems,
          subtotal: total,
          total,
          shippingAddress: state.context?.deliveryAddress,
          customerPhone,
          paymentMethod,
          stripeSessionId: null
        });

        let paymentResponse;

        // Process payment based on selected method
        switch (paymentMethod) {
          case 'mpesa':
            paymentResponse = await MobileMoneyService.initiateMpesaPayment(
              customerPhone,
              total,
              orderNumber,
              `Order-${orderNumber}`
            );
            break;

          case 'orange':
            paymentResponse = await MobileMoneyService.initiateOrangeMoneyPayment(
              customerPhone,
              total,
              orderNumber
            );
            break;

          case 'tigo':
            paymentResponse = await MobileMoneyService.initiateTigoPesaPayment(
              customerPhone,
              total,
              orderNumber
            );
            break;

          case 'stripe':
          default:
            // Create Stripe payment session
            const payment = await PaymentService.createServicePayment(
              phoneNumber,
              'shopping',
              {
                orderNumber,
                total,
                itemCount: cartItems.length,
                deliveryAddress: state.context?.deliveryAddress,
                customerPhone
              }
            );

            // Update order with Stripe session ID
            await pool.query(
              'UPDATE orders SET stripe_session_id = $1, payment_method = $2 WHERE order_number = $3',
              [payment.sessionId, 'stripe', orderNumber]
            );

            paymentResponse = {
              success: true,
              provider: 'Stripe',
              sessionId: payment.sessionId,
              message: payment.message
            };
            break;
        }

        if (!paymentResponse.success) {
          // Payment initiation failed
          await pool.query(
            'UPDATE orders SET status = $1 WHERE order_number = $2',
            ['failed', orderNumber]
          );

          return `⚠️ Payment initialization failed.\n\nError: ${paymentResponse.error}\n\nPlease try again or contact support.\n\n0️⃣  Back`;
        }

        // Update order with transaction ID if available
        if (paymentResponse.transactionId) {
          await pool.query(
            'UPDATE orders SET stripe_payment_intent = $1 WHERE order_number = $2',
            [paymentResponse.transactionId, orderNumber]
          );
        }

        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'awaiting-payment',
          context: {
            ...state.context,
            customerPhone,
            orderNumber,
            paymentProvider: paymentResponse.provider,
            transactionId: paymentResponse.transactionId || paymentResponse.sessionId
          }
        });

        return paymentResponse.message;
      } catch (error) {
        console.error('Payment error:', error);
        return `⚠️ Payment error occurred.\n\nError: ${error.message}\n\nPlease try again or type 0 to go back.`;
      }
    }

    return services.shopping.menu();
  }

  /**
   * Messaging Service Handler
   */
  static async handleMessaging(phoneNumber, message) {
    const state = ConversationManager.getUserState(phoneNumber);
    const msg = message.trim();

    if (state.currentStep === 'menu') {
      if (['1', '2', '3'].includes(msg)) {
        const plans = { '1': 'Starter', '2': 'Business', '3': 'Enterprise' };
        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'subscribe',
          context: { selectedPlan: plans[msg] }
        });
        return services.messaging.subscribe(plans[msg]);
      }
    }

    // Handle subscription payment
    if (state.currentStep === 'subscribe' && msg === '1') {
      const plan = state.context?.selectedPlan;
      try {
        const payment = await PaymentService.createServicePayment(
          phoneNumber,
          'messaging',
          {
            plan,
            messageCount: plan === 'Starter' ? '1,000' : plan === 'Business' ? '5,000' : '20,000'
          }
        );

        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'awaiting-payment',
          context: { ...state.context, paymentSessionId: payment.sessionId }
        });

        return payment.message;
      } catch (error) {
        console.error('Payment error:', error);
        return `⚠️ Payment error occurred.\n\nPlease try again or type MENU.`;
      }
    }

    return services.messaging.menu();
  }

  /**
   * Support Service Handler
   */
  static handleSupport(phoneNumber, message) {
    const state = ConversationManager.getUserState(phoneNumber);
    const msg = message.trim();

    if (state.currentStep === 'menu') {
      if (msg === '4') {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'create-ticket' });
        return services.support.createTicket();
      }
    }

    return services.support.menu();
  }

  /**
   * Appointments Service Handler
   */
  static handleAppointments(phoneNumber, message) {
    const state = ConversationManager.getUserState(phoneNumber);
    const msg = message.trim();

    if (state.currentStep === 'menu') {
      const serviceNames = {
        '1': 'Doctor Consultation',
        '2': 'Salon/Barbershop',
        '3': 'Dental Checkup',
        '4': 'Fitness Training',
        '5': 'Car Service',
        '6': 'Legal Consultation'
      };

      if (serviceNames[msg]) {
        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'select-date',
          context: { service: serviceNames[msg] }
        });
        return services.appointments.selectService(serviceNames[msg]);
      }
    }

    return services.appointments.menu();
  }

  /**
   * Groups Service Handler
   */
  static handleGroups(phoneNumber, message) {
    const msg = message.trim();

    if (msg === '6') {
      return services.groups.addGroup();
    }

    return services.groups.menu();
  }

  /**
   * Money Assistant Handler
   */
  static handleMoney(phoneNumber, message) {
    const msg = message.trim();

    if (msg === '6') {
      return services.money.addTransaction();
    }

    return services.money.menu();
  }

  /**
   * Courses Handler
   */
  static handleCourses(phoneNumber, message) {
    const state = ConversationManager.getUserState(phoneNumber);
    const msg = message.trim();

    if (state.currentStep === 'menu') {
      const categories = {
        '1': 'Programming',
        '2': 'Business',
        '3': 'Languages',
        '4': 'Design',
        '5': 'Marketing'
      };

      if (categories[msg]) {
        ConversationManager.updateUserState(phoneNumber, { currentStep: 'course-list' });
        return services.courses.courseList(categories[msg]);
      }
    }

    return services.courses.menu();
  }

  /**
   * News Handler
   */
  static async handleNews(phoneNumber, message) {
    const state = ConversationManager.getUserState(phoneNumber);
    const msg = message.trim();

    if (state.currentStep === 'menu') {
      if (['1', '2'].includes(msg)) {
        const plans = { '1': 'Basic', '2': 'Premium' };
        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'subscribe',
          context: { selectedPlan: plans[msg] }
        });
        return services.news.subscribe(plans[msg]);
      }
    }

    // Handle news subscription payment
    if (state.currentStep === 'subscribe' && msg === '1') {
      const plan = state.context?.selectedPlan;
      try {
        const payment = await PaymentService.createServicePayment(
          phoneNumber,
          'news',
          {
            plan,
            updates: plan === 'Basic' ? '3 updates/day' : 'Unlimited'
          }
        );

        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'awaiting-payment',
          context: { ...state.context, paymentSessionId: payment.sessionId }
        });

        return payment.message;
      } catch (error) {
        console.error('Payment error:', error);
        return `⚠️ Payment error occurred.\n\nPlease try again or type MENU.`;
      }
    }

    return services.news.menu();
  }

  /**
   * Marketing Handler
   */
  static handleMarketing(phoneNumber, message) {
    const msg = message.trim();

    if (msg === '4') {
      return services.marketing.createCampaign();
    }

    return services.marketing.menu();
  }

  /**
   * B2B Handler
   */
  static handleB2B(phoneNumber, message) {
    const msg = message.trim();

    if (msg === '1') {
      return services.b2b.catalog();
    }

    return services.b2b.menu();
  }

  /**
   * IPTV Handler
   */
  static async handleIPTV(phoneNumber, message) {
    const state = ConversationManager.getUserState(phoneNumber);
    const msg = message.trim();

    if (state.currentStep === 'menu') {
      if (['1', '2', '3'].includes(msg)) {
        const packages = { '1': 'Basic', '2': 'Standard', '3': 'Premium' };
        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'package-details',
          context: { selectedPackage: packages[msg] }
        });
        return services.iptv.packageDetails(packages[msg]);
      }
    }

    // Handle IPTV subscription payment
    if (state.currentStep === 'package-details' && msg === '1') {
      const packageName = state.context?.selectedPackage;
      try {
        const payment = await PaymentService.createServicePayment(
          phoneNumber,
          'iptv',
          {
            package: packageName,  // This will be used to generate custom M3U URL
            plan: packageName,     // For metadata
            channels: packageName === 'Basic' ? '500+' : packageName === 'Standard' ? '800+' : '1200+'
          }
        );

        ConversationManager.updateUserState(phoneNumber, {
          currentStep: 'awaiting-payment',
          context: { ...state.context, paymentSessionId: payment.sessionId }
        });

        return payment.message;
      } catch (error) {
        console.error('Payment error:', error);
        return `⚠️ Payment error occurred.\n\nPlease try again or type MENU.`;
      }
    }

    return services.iptv.menu();
  }
}

module.exports = ServiceHandler;
