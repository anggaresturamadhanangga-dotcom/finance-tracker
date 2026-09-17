// 1. Ambil elemen HTML
const form = document.getElementById('form-transaksi');
const keteranganInput = document.getElementById('keterangan');
const nominalInput = document.getElementById('nominal');
const tipeInput = document.getElementById('tipe');
const kategoriInput = document.getElementById('kategori');
const filterKategori = document.getElementById('filter-kategori');
const daftarTransaksi = document.getElementById('daftar-transaksi');
const totalSaldoEl = document.getElementById('total-saldo');
const inputFile = document.getElementById('input-file');

// 2. Ambil data transaksi dari localStorage
let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];

// Variable instance grafik
let chartKeuangan;

// 3. Fungsi Inisialisasi Grafik
function inisialisasiGrafik(totalPemasukan, totalPengeluaran) {
    const ctx = document.getElementById('grafik-keuangan').getContext('2d');
    
    if (chartKeuangan) {
        chartKeuangan.destroy();
    }

    chartKeuangan = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                data: [totalPemasukan, totalPengeluaran],
                backgroundColor: ['#10B981', '#EF4444'],
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

// 4. Fungsi Update UI & Hitung Saldo
function updateUI() {
    daftarTransaksi.innerHTML = '';
    let totalSaldo = 0;
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    transaksi.forEach(item => {
        if (item.tipe === 'pemasukan') {
            totalSaldo += item.nominal;
            totalPemasukan += item.nominal;
        } else {
            totalSaldo -= item.nominal;
            totalPengeluaran += item.nominal;
        }
    });

    const kategoriDipilih = filterKategori.value;

    const transaksiTersaring = transaksi.filter(item => {
        if (kategoriDipilih === 'semua') return true;
        return item.kategori === kategoriDipilih;
    });

    if (transaksiTersaring.length === 0) {
        daftarTransaksi.innerHTML = `<li class="text-center text-gray-400 text-sm py-4">Tidak ada transaksi.</li>`;
    }

    transaksiTersaring.forEach((item) => {
        const indexAsli = transaksi.indexOf(item);
        const isPemasukan = item.tipe === 'pemasukan';
        const warnaNominal = isPemasukan ? 'text-green-600' : 'text-red-600';
        const tanda = isPemasukan ? '+' : '-';

        const li = document.createElement('li');
        li.className = 'flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-lg';
        
        li.innerHTML = `
            <div>
                <p class="font-semibold text-gray-800 text-sm">${item.keterangan}</p>
                <div class="flex gap-2 items-center mt-1">
                    <span class="text-xs px-2 py-0.5 rounded ${isPemasukan ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} capitalize">
                        ${item.tipe}
                    </span>
                    <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                        ${item.kategori || 'Umum'}
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-bold text-sm ${warnaNominal}">
                    ${tanda} Rp ${item.nominal.toLocaleString('id-ID')}
                </span>
                <button onclick="hapusTransaksi(${indexAsli})" 
                    class="text-gray-400 hover:text-red-500 transition text-sm font-bold px-1">
                    ✕
                </button>
            </div>
        `;
        
        daftarTransaksi.appendChild(li);
    });

    totalSaldoEl.innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
    localStorage.setItem('transaksi', JSON.stringify(transaksi));

    inisialisasiGrafik(totalPemasukan, totalPengeluaran);
}

// 5. Form Submit Event
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const transaksiBaru = {
        keterangan: keteranganInput.value,
        nominal: Number(nominalInput.value),
        tipe: tipeInput.value,
        kategori: kategoriInput.value
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

// 7. FUNGSI EKSPOR DATA (DOWNLOAD FILE .JSON)
function eksporData() {
    if (transaksi.length === 0) {
        alert('Tidak ada data transaksi untuk diekspor!');
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transaksi, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_keuangan_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// 8. FUNGSI IMPOR DATA (READ FILE .JSON)
function pilihFileImpor() {
    inputFile.click(); // Memicu klik pada input file tersembunyi
}

function imporData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dataHasilImpor = JSON.parse(e.target.result);
            if (Array.isArray(dataHasilImpor)) {
                transaksi = dataHasilImpor;
                updateUI();
                alert('Data transaksi berhasil diimpor!');
            } else {
                alert('Format file JSON tidak valid!');
            }
        } catch (err) {
            alert('Gagal membaca file JSON!');
        }
    };
    reader.readAsText(file);
}

// Jalankan pertama kali
updateUI();
