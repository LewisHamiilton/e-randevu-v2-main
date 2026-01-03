const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let isReady = false;
let qrCodeData = null;

// WhatsApp Client'i başlat
function initWhatsApp() {
    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: './whatsapp-session'
        }),
        puppeteer: {
            headless: true,
            executablePath: '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    });

    // QR Kod oluşturulduğunda
    client.on('qr', (qr) => {
        console.log('📱 WhatsApp QR Kodu oluşturuldu!');
        qrCodeData = qr;
        qrcode.generate(qr, { small: true });
    });

    // Bağlantı hazır
    client.on('ready', () => {
        console.log('✅ WhatsApp bağlandı!');
        isReady = true;
        qrCodeData = null;
    });

    // Bağlantı kesildi
    client.on('disconnected', () => {
        console.log('❌ WhatsApp bağlantısı kesildi');
        isReady = false;
    });

    client.initialize();
}

// Mesaj gönder
// Mesaj gönder
async function sendMessage(phoneNumber, message) {
    if (!isReady) {
        throw new Error('WhatsApp bağlı değil');
    }

    try {
        // Numara formatı: 905551234567@c.us
        let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');

        // Eğer 0 ile başlıyorsa, 90 ile değiştir
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '90' + formattedNumber.substring(1);
        }
        // Eğer 90 ile başlamıyorsa, başına ekle
        else if (!formattedNumber.startsWith('90')) {
            formattedNumber = '90' + formattedNumber;
        }

        formattedNumber += '@c.us';

        console.log(`Gönderilecek numara: ${formattedNumber}`);
        await client.sendMessage(formattedNumber, message);
        console.log(`✅ Mesaj gönderildi: ${phoneNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Mesaj gönderilemedi:', error);
        throw error;
    }
}

// QR kodu al
function getQRCode() {
    return qrCodeData;
}

// Durum kontrol
function getStatus() {
    return {
        isReady,
        hasQR: qrCodeData !== null
    };
}

module.exports = {
    initWhatsApp,
    sendMessage,
    getQRCode,
    getStatus
};