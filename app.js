// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

// Límites para cálculo de semáforos
const LIMITES = {
    ecoli_max: 10,             // UFC/g (ROJO si > 10)
    fecales_max: 10,           // UFC/g (ROJO si > 10)
    totales_advertencia: 100,  // UFC/g (AMARILLO si > 100)
    totales_max: 1000          // UFC/g (ROJO si > 1000)
};

// Estado global
let proveedorActual = null;

// ============================================
// SEMÁFORO MICROBIOLÓGICO (FUNCIÓN ÚNICA)
// ============================================
function calcularSemaforoMicro(data) {
    const { salmonella, ecoli, fecales, totales } = data;

    let hayDato = false;
    let hayAdvertencia = false;

    // Salmonella
    if (salmonella && salmonella !== "N/A") {
        hayDato = true;
        if (salmonella === "POSITIVO") return "ROJO";
    }

    // E. coli
    if (ecoli !== null) {
        hayDato = true;
        if (ecoli > LIMITES.ecoli_max) return "ROJO";
    }

    // Fecales
    if (fecales !== null) {
        hayDato = true;
        if (fecales > LIMITES.fecales_max) return "ROJO";
    }

    // Totales
    if (totales !== null) {
        hayDato = true;
        if (totales > LIMITES.totales_max) return "ROJO";
        if (totales > LIMITES.totales_advertencia) hayAdvertencia = true;
    }

    if (!hayDato) return "N/A";
    if (hayAdvertencia) return "AMARILLO";
    return "VERDE";
}

// ============================================
// SEMÁFORO PESTICIDAS
// ============================================
function calcularSemaforoPesticidas(valor) {
    switch (valor) {
        case 'CUMPLE': return 'VERDE';
        case 'BAJO_RANGO': return 'AMARILLO';
        case 'NO CUMPLE': return 'ROJO';
        default: return 'GRIS';
    }
}

// ============================================
// PREVIEW DE SEMÁFOROS
// ============================================
function actualizarPreviewSemaforos() {
    const salmonella = document.getElementById('salmonella').value;

    const ecoliVal = document.getElementById('ecoli').value;
    const fecalesVal = document.getElementById('fecales').value;
    const totalesVal = document.getElementById('totales').value;

    const pesticidas = document.getElementById('pesticidas').value;

    const ecoli = ecoliVal === '' ? null : parseFloat(ecoliVal);
    const fecales = fecalesVal === '' ? null : parseFloat(fecalesVal);
    const totales = totalesVal === '' ? null : parseFloat(totalesVal);

    // Mostrar preview si hay AL MENOS UN dato
    if (
        salmonella === '' &&
        ecoli === null &&
        fecales === null &&
        totales === null &&
        pesticidas === ''
    ) {
        document.getElementById('preview-semaforos').classList.add('hidden');
        return;
    }

    const semMicro = calcularSemaforoMicro({ salmonella, ecoli, fecales, totales });
    const semPest = calcularSemaforoPesticidas(pesticidas);

    const previewMicro = document.getElementById('preview-micro');
    const previewPest = document.getElementById('preview-pesticidas');

    previewMicro.className = `semaforo ${semMicro.toLowerCase()}`;
    previewPest.className = `semaforo ${semPest.toLowerCase()}`;

    document.getElementById('preview-semaforos').classList.remove('hidden');
}

