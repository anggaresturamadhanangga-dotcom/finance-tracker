// ==========================================
// 1. KONFIGURASI SUPABASE
// ==========================================
// TODO: Ganti dengan URL dan ANON KEY milikmu!
const SUPABASE_URL = 'https://tvedxfjdspmirnjpjljw.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_NO7OUPMqle4RaRP2cUxfsQ_74CsSowt'; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variabel Global
let transaksiData = [];

// ==========================================
// 2. KETIKA HALAMAN PERTAMA KALI DIBUKA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Setel input tanggal otomatis ke hari ini
    document.getElementById('tanggal').valueAsDate = new Date();
    
    // Tarik data dari database
    fetchData();

    // Jalankan fungsi simpan ketika tombol disubmit
    document.getElementById('form-transaksi').addEventListener('submit', simpanTransaksi);
});

// ==========================================
// 3. FUNGSI AMBIL DATA DARI SUPABASE
// ==========================================
async function fetchData() {
    const { data, error } = await supabase
        .from('transaksi')
        .select('*')
        .order('tanggal', { ascending: false }) // Urutkan dari yang terbaru
        .order('created_at', { ascending: false }); // Urutan lapis kedua jika tanggalnya sama

    if (error) {
        console.error("Gagal memuat data:", error);
        document.getElementById('riwayat-list').innerHTML = `<p class="text-xs text-rose-500 text-center">Gagal memuat data.</p>`;
        return;
    }

    transaksiData = data;
    renderRiwayat();
    hitungTotal();
}

// ==========================================
// 4. FUNGSI SIMPAN DATA KE SUPABASE
// ==========================================
async function simpanTransaksi(event) {
    event.preventDefault(); // Cegah web reload

    const keterangan = document.getElementById('keterangan').value;
    const nominal = parseInt(document.getElementById('nominal').value);
    const tipe = document.getElementById('tipe').value;
    const kategori = document.getElementById('kategori').value;
    const tanggal = document.getElementById('tanggal').value;
    const metode_pembayaran = document.getElementById('metode_pembayaran').value;

    const { data, error } = await supabase
        .from('transaksi')
        .insert([
            {
                keterangan: keterangan,
                nominal: nominal,
                tipe: tipe,
                kategori: kategori,
                tanggal: tanggal,
                metode_pembayaran: metode_pembayaran
            }
        ]);

    if (error) {
        console.error("Error Simpan:", error);
        alert("Gagal menyimpan data!");
    } else {
        // Bersihkan form, kembalikan tanggal ke hari ini
        document.getElementById('form-transaksi').reset();
        document.getElementById('tanggal').valueAsDate = new Date();
        
        // Refresh layar
        fetchData(); 
    }
}

// ==========================================
// 5. FUNGSI MENAMPILKAN RIWAYAT KE LAYAR
// ==========================================
function renderRiwayat() {
    const listContainer = document.getElementById('riwayat-list');
    listContainer.innerHTML = ''; // Kosongkan layar dulu

    if (transaksiData.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-gray-500 text-center mt-10">Belum ada transaksi.</p>`;
        return;
    }

    transaksiData.forEach(trx => {
        // Tentukan warna badge Cash/Saldo
        const badgeWarna = trx.metode_pembayaran === 'Cash' 
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
            : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

        // Format tanggal agar mudah dibaca
        const tanggalFormat = new Date(trx.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        // Tentukan warna teks (Pemasukan = Hijau, Pengeluaran = Merah, Transfer = Abu-abu)
        let warnaUang = 'text-rose-400';
        let simbolUang = '-';
        if (trx.tipe === 'Pemasukan') {
            warnaUang = 'text-emerald-400';
            simbolUang = '+';
        } else if (trx.tipe === 'Transfer') {
            warnaUang = 'text-gray-400';
            simbolUang = ''; // Transfer tidak menambah/mengurangi total kekayaan
        }

        const itemHTML = `
            <div class="flex justify-between items-center p-3 mb-2 bg-[#2a1b1f] rounded-lg border border-white/5 hover:bg-[#312025] transition">
                <div>
                    <p class="text-sm text-white font-medium">${trx.keterangan}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-gray-400">${tanggalFormat}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full border ${badgeWarna}">
                            ${trx.metode_pembayaran}
                        </span>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold ${warnaUang}">
                        ${simbolUang} Rp ${trx.nominal.toLocaleString('id-ID')}
                    </p>
                    <p class="text-xs text-gray-500">${trx.kategori}</p>
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', itemHTML);
    });
}

// ==========================================
// 6. FUNGSI HITUNG TOTAL SALDO
// ==========================================
function hitungTotal() {
    let total = 0;

    transaksiData.forEach(trx => {
        if (trx.tipe === 'Pemasukan') {
            total += trx.nominal;
        } else if (trx.tipe === 'Pengeluaran') {
            total -= trx.nominal;
        }
        // Jika tipenya 'Transfer', saldo tidak dihitung (dilewati)
    });

    document.getElementById('total-saldo').innerText = `Rp ${total.toLocaleString('id-ID')}`;
}
