// 1. INISIALISASI SUPABASE CLIENT
const SUPABASE_URL = 'sb_publishable_NO7OUPMqle4RaRP2cUxfsQ_74CsSowt'; // Ganti dengan Project URL milikmu
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZWR4Zmpkc3BtaXJuanBqbGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2Mzg3MTEsImV4cCI6MjEwNTIxNDcxMX0.7n009EuecBDXQW5NZguJhvO_ErkQPvZ-yNDMxUqLtMA';     // Ganti dengan anon/public key milikmu
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Ambil elemen HTML
const form = document.getElementById('form-transaksi');
const keteranganInput = document.getElementById('keterangan');
const nominalInput = document.getElementById('nominal');
const tipeInput = document.getElementById('tipe');
const kategoriInput = document.getElementById('kategori');
const filterKategori = document.getElementById('filter-kategori');
const daftarTransaksi = document.getElementById('daftar-transaksi');
const totalSaldoEl = document.getElementById('total-saldo');
const inputFile = document.getElementById('input-file');

// Data transaksi lokal (diambil dari database)
let transaksi = [];
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
                legend: { position: 'bottom' }
            }
        }
    });
}

// 4. FUNGSI AMBIL DATA DARI SUPABASE DATABASE (CLOUD)
async function ambilDataDariCloud() {
    daftarTransaksi.innerHTML = `<li class="text-center text-gray-400 text-sm py-4">Memuat data dari database cloud...</li>`;

    // Mengambil semua data dari tabel 'transaksi' di Supabase
    const { data, error } = await supabaseClient
        .from('transaksi')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Gagal mengambil data:', error);
        alert('Gagal mengambil data dari cloud!');
        return;
    }

    transaksi = data || [];
    updateUI();
}

// 5. Fungsi Update UI & Hitung Saldo
function updateUI() {
    daftarTransaksi.innerHTML = '';
    let totalSaldo = 0;
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    transaksi.forEach(item => {
        if (item.tipe === 'pemasukan') {
            totalSaldo += Number(item.nominal);
            totalPemasukan += Number(item.nominal);
        } else {
            totalSaldo -= Number(item.nominal);
            totalPengeluaran += Number(item.nominal);
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
                    ${tanda} Rp ${Number(item.nominal).toLocaleString('id-ID')}
                </span>
                <button onclick="hapusTransaksi(${item.id})" 
                    class="text-gray-400 hover:text-red-500 transition text-sm font-bold px-1">
                    ✕
                </button>
            </div>
        `;
        
        daftarTransaksi.appendChild(li);
    });

    totalSaldoEl.innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
    inisialisasiGrafik(totalPemasukan, totalPengeluaran);
}

// 6. FUNGSI SIMPAN TRANSAKSI BARU KE SUPABASE
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const transaksiBaru = {
        keterangan: keteranganInput.value,
        nominal: Number(nominalInput.value),
        tipe: tipeInput.value,
        kategori: kategoriInput.value
    };

    // Menyimpan data baru ke tabel 'transaksi' Supabase
    const { error } = await supabaseClient
        .from('transaksi')
        .insert([transaksiBaru]);

    if (error) {
        console.error('Gagal menyimpan:', error);
        alert('Gagal menyimpan ke database cloud!');
        return;
    }

    keteranganInput.value = '';
    nominalInput.value = '';

    // Ambil ulang data terbaru dari cloud
    ambilDataDariCloud();
});

// 7. FUNGSI HAPUS TRANSAKSI DARI SUPABASE
async function hapusTransaksi(id) {
    const { error } = await supabaseClient
        .from('transaksi')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Gagal menghapus:', error);
        alert('Gagal menghapus transaksi!');
        return;
    }

    ambilDataDariCloud();
}

// 8. FUNGSI EKSPOR & IMPOR DATA
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

function pilihFileImpor() {
    inputFile.click();
}

function imporData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const dataHasilImpor = JSON.parse(e.target.result);
            if (Array.isArray(dataHasilImpor)) {
                // Hapus properti 'id' bawaan jika ada agar tidak bentrok dengan ID otomatis Supabase
                const dataSiapUpload = dataHasilImpor.map(({ id, created_at, ...sisa }) => sisa);

                const { error } = await supabaseClient.from('transaksi').insert(dataSiapUpload);
                
                if (error) throw error;

                alert('Data transaksi berhasil diimpor ke Cloud!');
                ambilDataDariCloud();
            } else {
                alert('Format file JSON tidak valid!');
            }
        } catch (err) {
            console.error(err);
            alert('Gagal mengimpor data ke cloud!');
        }
    };
    reader.readAsText(file);
}

// Jalankan pengambilan data cloud saat halaman pertama kali dimuat
ambilDataDariCloud();
