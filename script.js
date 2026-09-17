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
