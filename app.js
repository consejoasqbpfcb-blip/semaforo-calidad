// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

const LIMITES = {
    ecoli_max: 10,             // UFC/g (ROJO si > 10)
    fecales_max: 10,           // UFC/g (ROJO si > 10)
    totales_advertencia: 100,  // UFC/g (AMARILLO si > 100)
    totales_max: 1000          // UFC/g (ROJO si > 1000)
};

// ============================================
// FUNCIÓN ÚNICA DE SEMÁFORO MICROBIOLÓGICO
// ============================================

function calcularSemaforoMicro(data) {
    const { salmonella, ecoli, fecales, totales } = data;

    let hayDato = false;
    let hayAdvertencia = false;

    // SALMONELLA
    if (salmonella && salmonella !== "N/A") {
        hayDato = true;
        if (salmonella === "POSITIVO") {
            return "ROJO";
        }
    }

    // E. COLI
    if (ecoli !== null && ecoli !== undefined) {
        hayDato = true;
        if (ecoli > LIMITES.ecoli_max) {
            return "ROJO";
        }
    }

    // FECALES
    if (fecales !== null && fecales !== undefined) {
        hayDato = true;
        if (fecales > LIMITES.fecales_max) {
            return "ROJO";
        }
    }

    // TOTALES
    if (totales !== null && totales !== undefined) {
        hayDato = true;

        if (totales > LIMITES.totales_max) {
            return "ROJO";
        }

        if (totales > LIMITES.totales_advertencia) {
            hayAdvertencia = true;
        }
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
// PREVIEW DE SEMÁFOROS (CORREGIDO)
// ============================================

function actualizarPreviewSemaforos() {
    const salmonella = document.getElementById('salmonella').value || null;

    const ecoliVal = document.getElementById('ecoli').value;
    const fecalesVal = document.getElementById('fecales').value;
    const totalesVal = document.getElementById('totales').value;

    const ecoli = ecoliVal !== "" ? parseFloat(ecoliVal) : null;
    const fecales = fecalesVal !== "" ? parseFloat(fecalesVal) : null;
    const totales = totalesVal !== "" ? parseFloat(totalesVal) : null;

    const pesticidas = document.getElementById('pesticidas').value;

    // Si NO hay absolutamente ningún dato, no mostrar preview
    if (!salmonella && ecoli === null && fecales === null && totales === null && !pesticidas) {
        document.getElementById('preview-semaforos').classList.add('hidden');
        return;
    }

    const semMicro = calcularSemaforoMicro({ salmonella, ecoli, fecales, totales });
    const semPest = calcularSemaforoPesticidas(pesticidas);

    document.getElementById('preview-micro').className =
        `semaforo ${semMicro.toLowerCase()}`;

    document.getElementById('preview-pesticidas').className =
        `semaforo ${semPest.toLowerCase()}`;

    document.getElementById('preview-semaforos').classList.remove('hidden');
}
