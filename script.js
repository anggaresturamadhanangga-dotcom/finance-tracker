const SUPABASE_URL = 'https://tvedxfjdspmirnjpjljw.supabase.co'; // Ganti dengan Project URL milikmu
const SUPABASE_KEY = 'sb_publishable_NO7OUPMqle4RaRP2cUxfsQ_74CsSowt';     // Ganti dengan anon/public key milikmu
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const formAuth = document.getElementById('form-auth');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authTitle = document.getElementById('auth-title');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const btnToggleAuth = document.getElementById('btn-toggle-auth');
const userEmailDisplay = document.getElementById('user-email-display');

const form = document.getElementById('form-transaksi');
const keteranganInput = document.getElementById('keterangan');
const nominalInput = document.getElementById('nominal');
const tipeInput = document.getElementById('tipe');
const kategoriInput = document.getElementById('kategori');
const filterKategoriFull = document.getElementById('filter-kategori-full');
const daftarTransaksi = document.getElementById('daftar-transaksi');
const daftarTransaksiFull = document.getElementById('daftar-transaksi-full');
const totalSaldoEl = document.getElementById('total-saldo');
const totalPemasukanText = document.getElementById('total-pemasukan-text');
const totalPengeluaranText = document.getElementById('total-pengeluaran-text');
const inputFile = document.getElementById('input-file');

let transaksi = [];
let chartKeuangan;
let isRegisterMode = false;
let currentUser = null;

// LOGIKA NAVIGASI TAB SIDEBAR
function gantiTab(tabName) {
    // 1. Sembunyikan semua section tab
    document.getElementById('view-dashboard')?.classList.add('hidden');
    document.getElementById('view-transaksi')?.classList.add('hidden');
    document.getElementById('view-analytics')?.classList.add('hidden');

    // 2. Reset style seluruh tombol di navbar
    const navs = ['nav-dashboard', 'nav-transaksi', 'nav-analytics'];
    navs.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.className = 'relative group w-full p-3 hover:text-rose-400 hover:bg-white/5 rounded-2xl flex justify-center items-center transition-all duration-300 ease-out';
            const indicator = btn.querySelector('.active-indicator');
            if (indicator) indicator.classList.add('hidden');
        }
    });

    // 3. Beri style aktif & tampilkan indikator pada tombol yang diklik
    const activeNav = document.getElementById(`nav-${tabName}`);
    if (activeNav) {
        activeNav.className = 'relative group w-full p-3 text-rose-500 bg-rose-500/10 rounded-2xl flex justify-center items-center transition-all duration-300 ease-out border border-rose-500/20 shadow-md shadow-rose-950/30';
        const activeIndicator = activeNav.querySelector('.active-indicator');
        if (activeIndicator) activeIndicator.classList.remove('hidden');
    }

    // 4. Tampilkan tab yang dipilih
    const activeView = document.getElementById(`view-${tabName}`);
    if (activeView) {
        activeView.classList.remove('hidden');
    }
}
// LOGIKA AUTH
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

formAuth.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;

    if (isRegisterMode) {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) alert('Gagal: ' + error.message);
        else { alert('Pendaftaran berhasil! Silakan login.'); toggleAuthMode(); }
    } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) alert('Gagal Login: ' + error.message);
        else { currentUser = data.user; cekSesiUser(); }
    }
});

async function cekSesiUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        userEmailDisplay.innerText = currentUser.email;
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        ambilDataDariCloud();
    } else {
        currentUser = null;
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
}

async function keluarAkun() {
    await supabaseClient.auth.signOut();
    cekSesiUser();
}

// DATABASE & UI RENDERING
async function ambilDataDariCloud() {
    if (!currentUser) return;
    const { data, error } = await supabaseClient
        .from('transaksi')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('id', { ascending: false });

    if (!error) {
        transaksi = data || [];
        updateUI();
    }
}

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
            plugins: { legend: { display: false } },
            cutout: '75%'
        }
    });
}

function updateUI() {
    daftarTransaksi.innerHTML = '';
    daftarTransaksiFull.innerHTML = '';
    let totalSaldo = 0, totalPemasukan = 0, totalPengeluaran = 0;

    transaksi.forEach(item => {
        if (item.tipe === 'pemasukan') {
            totalSaldo += Number(item.nominal);
            totalPemasukan += Number(item.nominal);
        } else {
            totalSaldo -= Number(item.nominal);
            totalPengeluaran += Number(item.nominal);
        }
    });

    const katFull = filterKategoriFull ? filterKategoriFull.value : 'semua';
    const transaksiFullSaring = transaksi.filter(item => katFull === 'semua' || item.kategori === katFull);

    const renderItem = (item) => {
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
                <span class="font-bold text-xs ${warnaNominal}">${tanda} Rp ${Number(item.nominal).toLocaleString('id-ID')}</span>
                <button onclick="hapusTransaksi(${item.id})" class="text-gray-500 hover:text-rose-400 transition text-xs">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        return li;
    };

    transaksi.slice(0, 5).forEach(item => daftarTransaksi.appendChild(renderItem(item)));
    transaksiFullSaring.forEach(item => daftarTransaksiFull.appendChild(renderItem(item)));

    totalSaldoEl.innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
    totalPemasukanText.innerText = `Rp ${totalPemasukan.toLocaleString('id-ID')}`;
    totalPengeluaranText.innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    inisialisasiGrafik(totalPemasukan, totalPengeluaran);
}

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
    const { error } = await supabaseClient.from('transaksi').insert([transaksiBaru]);
    if (!error) {
        keteranganInput.value = '';
        nominalInput.value = '';
        ambilDataDariCloud();
    }
});

async function hapusTransaksi(id) {
    const { error } = await supabaseClient.from('transaksi').delete().eq('id', id);
    if (!error) ambilDataDariCloud();
}

function eksporData() {
    if (!transaksi.length) return alert('Tidak ada data!');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transaksi, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `backup_keuangan_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
}

function pilihFileImpor() { inputFile.click(); }

function imporData(event) {
    const file = event.target.files[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                const dataSiap = data.map(({ id, created_at, user_id, ...sisa }) => ({ ...sisa, user_id: currentUser.id }));
                await supabaseClient.from('transaksi').insert(dataSiap);
                ambilDataDariCloud();
            }
        } catch (err) { alert('Gagal impor!'); }
    };
    reader.readAsText(file);
}

cekSesiUser();
