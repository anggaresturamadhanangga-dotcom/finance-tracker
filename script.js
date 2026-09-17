// 1. Ambil elemen HTML
const form = document.getElementById('form-transaksi');
const keteranganInput = document.getElementById('keterangan');
const nominalInput = document.getElementById('nominal');
const tipeInput = document.getElementById('tipe');
const daftarTransaksi = document.getElementById('daftar-transaksi');
const totalSaldoEl = document.getElementById('total-saldo');

// 2. Ambil data transaksi dari localStorage
let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];

// Variable untuk menyimpan instance grafik
let chartKeuangan;

// 3. Fungsi untuk Inisialisasi Grafik Chart.js
function inisialisasiGrafik(totalPemasukan, totalPengeluaran) {
    const ctx = document.getElementById('grafik-keuangan').getContext('2d');
    
    // Jika grafik sudah pernah dibuat, hancurkan dulu sebelum menggambar ulang
    if (chartKeuangan) {
        chartKeuangan.destroy();
    }

    chartKeuangan = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                data: [totalPemasukan, totalPengeluaran],
                backgroundColor: ['#10B981', '#EF4444'], // Warna hijau dan merah
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// 4. Fungsi untuk memperbarui UI & menghitung saldo
function updateUI() {
    daftarTransaksi.innerHTML = '';
    let totalSaldo = 0;
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    if (transaksi.length === 0) {
        daftarTransaksi.innerHTML = `<li class="text-center text-gray-400 text-sm py-4">Belum ada transaksi.</li>`;
    }

    transaksi.forEach((item, index) => {
        if (item.tipe === 'pemasukan') {
            totalSaldo += item.nominal;
            totalPemasukan += item.nominal;
        } else {
            totalSaldo -= item.nominal;
            totalPengeluaran += item.nominal;
        }

        const isPemasukan = item.tipe === 'pemasukan';
        const warnaNominal = isPemasukan ? 'text-green-600' : 'text-red-600';
        const tanda = isPemasukan ? '+' : '-';

        const li = document.createElement('li');
        li.className = 'flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-lg';
        
        li.innerHTML = `
            <div>
                <p class="font-semibold text-gray-800 text-sm">${item.keterangan}</p>
                <span class="text-xs px-2 py-0.5 rounded ${isPemasukan ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} capitalize">
                    ${item.tipe}
                </span>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-bold text-sm ${warnaNominal}">
                    ${tanda} Rp ${item.nominal.toLocaleString('id-ID')}
                </span>
                <button onclick="hapusTransaksi(${index})" 
                    class="text-gray-400 hover:text-red-500 transition text-sm font-bold px-1">
                    ✕
                </button>
            </div>
        `;
        
        daftarTransaksi.appendChild(li);
    });

    // Update teks Total Saldo & simpan
    totalSaldoEl.innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
    localStorage.setItem('transaksi', JSON.stringify(transaksi));

    // Update Grafik
    inisialisasiGrafik(totalPemasukan, totalPengeluaran);
}

// 5. Form Submit Event
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const transaksiBaru = {
        keterangan: keteranganInput.value,
        nominal: Number(nominalInput.value),
        tipe: tipeInput.value
    };

    transaksi.push(transaksiBaru);
    updateUI();

    keteranganInput.value = '';
    nominalInput.value = '';
});

// 6. Fungsi Hapus Transaksi
function hapusTransaksi(index) {
    transaksi.splice(index, 1);
    updateUI();
}

// Jalankan pertama kali
updateUI();
