// 1. Ambil elemen HTML
const form = document.getElementById('form-transaksi');
const keteranganInput = document.getElementById('keterangan');
const nominalInput = document.getElementById('nominal');
const tipeInput = document.getElementById('tipe');
const daftarTransaksi = document.getElementById('daftar-transaksi');
const totalSaldoEl = document.getElementById('total-saldo');

// 2. Ambil data transaksi dari localStorage (jika ada), atau gunakan array kosong []
let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];

// 3. Fungsi untuk memperbarui tampilan UI & menghitung total saldo
function updateUI() {
    daftarTransaksi.innerHTML = '';
    let totalSaldo = 0;

    if (transaksi.length === 0) {
        daftarTransaksi.innerHTML = `<li class="text-center text-gray-400 text-sm py-4">Belum ada transaksi.</li>`;
    }

    transaksi.forEach((item, index) => {
        if (item.tipe === 'pemasukan') {
            totalSaldo += item.nominal;
        } else {
            totalSaldo -= item.nominal;
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

    totalSaldoEl.innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
    localStorage.setItem('transaksi', JSON.stringify(transaksi));
}

// 4. Fungsi untuk menambah transaksi baru
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const transaksiBaru = {
        keterangan: keteranganInput.value,
        nominal: Number(nominalInput.value),
        tipe: tipeInput.value
    };

    // Masukkan data baru ke dalam array transaksi
    transaksi.push(transaksiBaru);

    // Perbarui UI & Simpan
    updateUI();

    // Reset isi form
    keteranganInput.value = '';
    nominalInput.value = '';
});

// 5. Fungsi untuk menghapus transaksi berdasarkan indeksnya
function hapusTransaksi(index) {
    transaksi.splice(index, 1); // Hapus 1 data pada indeks tersebut
    updateUI(); // Perbarui tampilan & simpan ulang
}

// 6. Jalankan updateUI pertama kali saat halaman dibuka
updateUI();