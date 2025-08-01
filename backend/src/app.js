const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const reviewRoutes = require('./routes/reviews');
const searchRoutes = require('./routes/search');
const aiRoutes = require('./routes/ai');
const blockchainRoutes = require('./routes/blockchain');
const analyticsRoutes = require('./routes/analytics');
const deliveryRoutes = require('./routes/delivery');
const sellerRoutes = require('./routes/seller');
const complaintsRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const walletRoutes = require('./routes/wallet');
const franchiseRoutes = require('./routes/franchise');
const publicRoutes = require('./routes/public');
const serviceRoutes = require('./routes/services');
const riderRoutes = require('./routes/riders');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { protect } = require('./middleware/auth');
const { validateRequest } = require('./middleware/validation');

// Import services
const complaintEscalationService = require('./services/complaintEscalationService');

// Import models (ensure they are loaded)
require('./models/User');
require('./models/Seller');
require('./models/Product');
require('./models/Order');
require('./models/Category');
require('./models/Service');
require('./models/Rider');
require('./models/Delivery');
require('./models/Complaint');
require('./models/Wallet');
require('./models/Transaction');
require('./models/SQLUpgradeRequest');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/cart', protect, cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/delivery', protect, deliveryRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/franchise', franchiseRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/riders', riderRoutes);

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: '🌟 GoSellr API - World\'s Best E-commerce Platform',
    version: '1.0.0',
    status: 'Active',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      users: '/api/users',
      orders: '/api/orders',
      cart: '/api/cart',
      reviews: '/api/reviews',
      search: '/api/search',
      ai: '/api/ai',
      blockchain: '/api/blockchain',
      analytics: '/api/analytics',
      delivery: '/api/delivery',
      payments: '/api/payments',
      sellers: '/api/sellers',
      notifications: '/api/notifications'
    },
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist`,
    availableRoutes: [
      '/api/auth',
      '/api/products',
      '/api/categories',
      '/api/users',
      '/api/orders',
      '/api/cart',
      '/api/reviews',
      '/api/search',
      '/api/ai',
      '/api/blockchain',
      '/api/analytics',
      '/api/delivery',
      '/api/payments',
      '/api/sellers',
      '/api/notifications'
    ]
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gosellr', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('🌟 MongoDB Connected Successfully!');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Host: ${conn.connection.host}`);
    console.log(`🚀 Port: ${conn.connection.port}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 5002;
const startServer = async () => {
  try {
    await connectDB();

    // Initialize complaint escalation service
    console.log('🕐 Initializing complaint escalation service...');
    // The service auto-initializes with cron jobs
    console.log('✅ Complaint escalation service initialized.');

    const server = app.listen(PORT, () => {
      console.log('🌟 GoSellr Backend Server Started Successfully!');
      console.log('================================================');
      console.log(`🚀 Server running on port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('================================================');
      console.log('🌟 World\'s Best E-commerce Platform Backend Ready!');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
