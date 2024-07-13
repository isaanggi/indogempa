// Inisialisasi IndexedDB
async function initIndexedDB() {
    // Memeriksa apakah IndexedDB didukung oleh browser
    if (!('indexedDB' in window)) {
        console.log('IndexedDB tidak didukung di browser ini.');
        return;
    }

    const dbName = 'gempaDB'; // Nama database IndexedDB
    const dbVersion = 1; // Versi database IndexedDB

    // Membuka atau membuat database
    const request = indexedDB.open(dbName, dbVersion);

    // Penanganan error saat membuka database
    request.onerror = function(event) {
        console.error('Error opening indexedDB:', event.target.errorCode);
    };

    // Upgrade database saat versi berubah
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        const objectStore = db.createObjectStore('gempa', { keyPath: 'tanggal' });

        objectStore.createIndex('tanggal', 'tanggal', { unique: false });
    };

    // Berhasil membuka database
    request.onsuccess = function(event) {
        console.log('IndexedDB berhasil diakses.');

        const db = event.target.result;

        // Transaksi ke database untuk menyimpan data
        const transaction = db.transaction(['gempa'], 'readwrite');
        const objectStore = transaction.objectStore('gempa');
        const request = objectStore.put({
            tanggal: new Date().toISOString(),
            data: {
                info: {
                    tanggal: document.getElementById('info-gempa').innerText,
                    daftar: document.getElementById('daftar-gempa').innerText
                }
            }
        });

        // Data berhasil disimpan di IndexedDB
        request.onsuccess = function() {
            console.log('Data gempa tersimpan di IndexedDB.');
        };

        // Transaksi ke database selesai
        transaction.oncomplete = function() {
            db.close();
        };
    };
}

// Memuat data dari API
async function loadLatestEarthquakeData() {
    try {
        const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
        const data = await response.json();

        const gempa = data.Infogempa.gempa;
        const shakemapUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`;

        // Struktur konten atau tampilan data
        const infoGempaHTML = `
            <h2>Informasi Gempa Terkini</h2>
            <p>Tanggal: ${gempa.Tanggal}</p>
            <p>Jam: ${gempa.Jam}</p>
            <p>Magnitude: ${gempa.Magnitude}</p>
            <p>Kedalaman: ${gempa.Kedalaman}</p>
            <p>Wilayah: ${gempa.Wilayah}</p>
            <p>Potensi Tsunami: ${gempa.Potensi}</p>
            <img src="${shakemapUrl}" alt="Shakemap">
        `;

        // Menampilkan konten
        document.getElementById('info-gempa').innerHTML = infoGempaHTML;

    } catch (error) {
        console.error('Error fetching latest earthquake data:', error);
    }
}

// Memuat daftar data dari API
async function loadEarthquakesData() {
    try {
        const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
        const data = await response.json();

        const gempaList = data.Infogempa.gempa;

        // Struktur konten atau tampilan data
        let daftarGempaHTML = '<h2>Daftar Gempa Bumi M 5.0+</h2>';
        gempaList.forEach(gempa => {
            daftarGempaHTML += `
                <div class="gempa-item">
                    <h3>${gempa.Tanggal}</h3>
                    <p>Jam: ${gempa.Jam}</p>
                    <p>Magnitude: ${gempa.Magnitude}</p>
                    <p>Kedalaman: ${gempa.Kedalaman}</p>
                    <p>Wilayah: ${gempa.Wilayah}</p>
                </div>
            `;
        });

        // Menampilkan konten
        document.getElementById('daftar-gempa').innerHTML = daftarGempaHTML;

    } catch (error) {
        console.error('Error fetching earthquakes data:', error);
    }
}

// Registrasi service worker 
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
                console.log('Service Worker registered.', reg);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

// Untuk keperluan Add to Home Screen (Install-able)
let deferredPrompt;
const installButton = document.getElementById('install-button');

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.style.display = 'block';

    installButton.addEventListener('click', () => {
        deferredPrompt.prompt();

        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
            installButton.style.display = 'none';
        });
    });
});

// Untuk memuat data saat halaman diakses
document.addEventListener('DOMContentLoaded', async () => {
    await loadLatestEarthquakeData();
    await loadEarthquakesData();
    await initIndexedDB();
});
