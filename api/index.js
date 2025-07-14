import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
dotenv.config();
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Schema
const requestSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  serviceType: String,
  status: { type: String, default: 'pending' },
  time: String,
  createdAt: { type: Date, default: Date.now }
});
const Request = mongoose.model('Request', requestSchema);
const serviceProviderSchema = new mongoose.Schema({
  name: String,
  profession: String,
  phone: String,
  location: String,
  rating:String,
  status: { type: String, default: 'Not Assigned' } 
});

const ServiceProvider = mongoose.model('ServiceProvider', serviceProviderSchema);


// Routes to serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/QuickFix.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/Admin.html'));
});

// API to submit service request

app.post('/api/submit-request', async (req, res) => {
  console.log("📥 Request received:", req.body); // ✅ Add this
  try {
    const newRequest = new Request(req.body);
    await newRequest.save();

    const matchingWorkers = await ServiceProvider.find({
      profession: { $regex: req.body.serviceType, $options: 'i' },
      status: 'Not Assigned'
    }).limit(2);

    if (matchingWorkers.length === 0) {
      return res.json({ success: false, message: 'No available workers found.' });
    }

    // 🧾 Build the message
    let message = `Hello ${req.body.name},\nThank you for using QuickFix!\nHere are your workers:\n\n`;

    matchingWorkers.forEach((worker, i) => {
      message += `${i + 1}. ${worker.name}\n📞 ${worker.phone}\n📍 ${worker.location}\n\n`;
    });
    const customerPhone = `91${req.body.phone.replace(/\D/g, '')}`
    // ✅ Send WhatsApp message using your cURL API
    const response = await fetch('https://whatsapp-api-web.onrender.com/message/text?key=quickfix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:JSON.stringify({
           id: customerPhone,    // ✅ phone with +91 or 91
          message: message
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to send WhatsApp:', result);
    }

    // ✅ Final response to frontend
    res.json({
      success: true,
      message: 'Request submitted and WhatsApp message sent!',
      sentTo: req.body.phone,
      workersSent: matchingWorkers.length
    });

  } catch (err) {
    console.error('❌ Error in submit-request:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// API to fetch all requests
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    console.error('❌ Error fetching data:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// API to fetch all service providers
app.get('/api/service-providers', async (req, res) => {
  try {
    const providers = await ServiceProvider.find();
    res.json({ success: true, data: providers });
  } catch (err) {
    console.error('❌ Error fetching service providers:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// API to update worker rating
app.put('/api/service-providers/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body;
    await ServiceProvider.findByIdAndUpdate(req.params.id, { rating });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error updating rating:', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});


// API to update request status
app.put('/api/requests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await Request.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error updating status:', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

app.put('/api/service-providers/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await ServiceProvider.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error updating status:', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
