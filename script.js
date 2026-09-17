// 1. INISIALISASI SUPABASE CLIENT
const SUPABASE_URL = 'https://tvedxfjdspmirnjpjljw.supabase.co'; // Ganti dengan Project URL milikmu
const SUPABASE_KEY = 'sb_publishable_NO7OUPMqle4RaRP2cUxfsQ_74CsSowt';     // Ganti dengan anon/public key milikmu
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elemen Auth
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const formAuth = document.getElementById('form-auth');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authTitle = document.getElementById('auth-title');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const btnToggleAuth = document.getElementById('btn-toggle-auth');
const userEmailDisplay = document.getElementById('user-email-display');

// Elemen Dashboard
const form = document.getElementById('form-transaksi');
const keteranganInput = document.getElementById('keterangan');
const nominalInput = document.getElementById('nominal');
const tipeInput = document.getElementById('tipe');
const kategoriInput = document.getElementById('kategori');
const filterKategori = document.getElementById('filter-kategori');
const daftarTransaksi = document.getElementById('daftar-transaksi');
const totalSaldoEl = document.getElementById('total-saldo');
const inputFile = document.getElementById('input-file');

let transaksi = [];
let chartKeuangan;
let isRegisterMode = false;
let currentUser = null;

// 2. TOGGLE MODE FORM (LOGIN / REGISTER)
function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    if (isRegisterMode) {
        authTitle.innerText = "Daftar Akun Baru";
        btnAuthSubmit.innerText = "Daftar";
        btnToggleAuth.innerText = "Sudah punya akun? Masuk di sini";
    } else {
        authTitle.innerText = "Masuk ke Akun";
        btnAuthSubmit.innerText = "Masuk";
        btnToggleAuth.innerText = "Belum punya akun? Daftar di sini";
    }
}

// 3. LOGIKA HANDE SUBMIT AUTH (LOGIN / REGISTER)
formAuth.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;

    if (isRegisterMode) {
        // Pendaftaran Akun Baru
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
            alert('Gagal Pendaftaran: ' + error.message);
        } else {
            alert('Pendaftaran berhasil! Silakan masuk dengan akun barumu.');
            toggleAuthMode();
        }
    } else {
        // Login Akun
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            alert('Gagal Login: ' + error.message);
        } else {
            currentUser = data.user;
            cekSesiUser();
        }
    }
});

// 4. LOGIKA CEK SESI USER & TAMPILAN
async function cekSesiUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        userEmailDisplay.innerText = `Logged in as: ${currentUser.email}`;
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        ambilDataDariCloud();
    } else {
        currentUser = null;
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
}

// 5. LOGIKA LOGOUT
async function keluarAkun() {
    await supabaseClient.auth.signOut();
    cekSesiUser();
}

// 6. AMBIL DATA DARI CLOUD (BERDASARKAN USER_ID)
async function ambilDataDariCloud() {
    if (!currentUser) return;
    daftarTransaksi.innerHTML = `<li class="text-center text-gray-400 text-sm py-4">Memuat data...</li>`;

    const { data, error } = await supabaseClient
        .from('transaksi')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('id', { ascending: false });

    if (error) {
        console.error('Gagal mengambil data:', error);
        return;
    }

    transaksi = data || [];
    updateUI();
}

// 7. INSIALISASI GRAFIK
function inisialisasiGrafik(totalPemasukan, totalPengeluaran) {
    const ctx = document.getElementById('grafik-keuangan').getContext('2d');
    if (chartKeuangan) chartKeuangan.destroy();

    chartKeuangan = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                data: [totalPemasukan || 1, totalPengeluaran || 0],
                backgroundColor: ['#e63946', '#402b30'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            cutout: '75%'
        }
    });
}

// 8. UPDATE UI DASHBOARD
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
        const warnaNominal = isPemasukan ? 'text-emerald-400' : 'text-rose-400';
        const tanda = isPemasukan ? '+' : '-';

        const li = document.createElement('li');
        li.className = 'flex items-center justify-between p-3 rounded-2xl bg-[#201417] border border-white/5 hover:border-white/10 transition';
        
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl ${isPemasukan ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} flex items-center justify-center text-sm">
                    <i class="${isPemasukan ? 'ri-arrow-down-line' : 'ri-arrow-up-line'}"></i>
                </div>
                <div>
                    <p class="font-semibold text-white text-xs">${item.keterangan}</p>
                    <span class="text-[10px] text-gray-400 capitalize">${item.kategori || 'Umum'}</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-bold text-xs ${warnaNominal}">
                    ${tanda} Rp ${Number(item.nominal).toLocaleString('id-ID')}
                </span>
                <button onclick="hapusTransaksi(${item.id})" class="text-gray-500 hover:text-rose-400 transition text-xs">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        daftarTransaksi.appendChild(li);
    });

    totalSaldoEl.innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
    inisialisasiGrafik(totalPemasukan, totalPengeluaran);
}

// 9. FORM SUBMIT TRANSAKSI BARU
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!currentUser) return;

    const transaksiBaru = {
        user_id: currentUser.id,
        keterangan: keteranganInput.value,
        nominal: Number(nominalInput.value),
        tipe: tipeInput.value,
        kategori: kategoriInput.value
    };

    const { error } = await supabaseClient
        .from('transaksi')
        .insert([transaksiBaru]);

    if (error) {
        alert('Gagal menyimpan: ' + error.message);
        return;
    }

    keteranganInput.value = '';
    nominalInput.value = '';
    ambilDataDariCloud();
});

// 10. HAPUS TRANSAKSI
async function hapusTransaksi(id) {
    const { error } = await supabaseClient
        .from('transaksi')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Gagal menghapus!');
        return;
    }

    ambilDataDariCloud();
}

// 11. EKSPOR & IMPOR DATA
function eksporData() {
    if (transaksi.length === 0) {
        alert('Tidak ada data transaksi!');
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
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const dataHasilImpor = JSON.parse(e.target.result);
            if (Array.isArray(dataHasilImpor)) {
                const dataSiapUpload = dataHasilImpor.map(({ id, created_at, user_id, ...sisa }) => ({
                    ...sisa,
                    user_id: currentUser.id
                }));

                const { error } = await supabaseClient.from('transaksi').insert(dataSiapUpload);
                if (error) throw error;

                alert('Data berhasil diimpor!');
                ambilDataDariCloud();
            }
        } catch (err) {
            alert('Gagal mengimpor data!');
        }
    };
    reader.readAsText(file);
}

// Jalankan pengecekan sesi saat halaman dimuat
cekSesiUser();
