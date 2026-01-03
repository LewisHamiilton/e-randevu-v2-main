const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initWhatsApp, sendMessage, getQRCode, getStatus } = require('./whatsapp_service');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// WhatsApp'ı başlat
initWhatsApp();

// QR kod endpoint'i
app.get('/api/whatsapp/qr', (req, res) => {
    const qr = getQRCode();
    if (qr) {
        res.json({ success: true, qr });
    } else {
        res.json({ success: false, message: 'QR kod yok veya bağlantı zaten kurulu' });
    }
});

// Durum kontrolü
app.get('/api/whatsapp/status', (req, res) => {
    res.json(getStatus());
});

// Mesaj gönderme
app.post('/api/whatsapp/send', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Telefon ve mesaj gerekli' });
    }

    try {
        await sendMessage(phone, message);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 WhatsApp servisi http://localhost:${PORT} adresinde çalışıyor`);
});

// Hata yakalama
process.on('uncaughtException', (error) => {
    console.error('❌ Yakalanmamış hata:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise reddi:', reason);
});