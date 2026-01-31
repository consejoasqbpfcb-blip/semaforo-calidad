// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

const LIMITES = {
    ecoli_max: 10,              // UFC/g (ROJO si > 10)
    fecales_max: 10,            // UFC/g (ROJO si > 10)
    totales_advertencia: 100,   // UFC/g (AMARILLO si > 100)
    totales_max: 1000           // UFC/g (ROJO si > 1000)
};

let proveedorActual = null;

// ============================================
// CÁLCULO DE SEMÁFOROS
// ============================================

function calcularSemaforoMicro({ salmonella, ecoli, fecales, totales }) {

    let hayDato = false;
    let hayAdvertencia = false;

    // ----------------------------
    // SALMONELLA
    // ----------------------------
    if (salmonella && salmonella !== "N/A") {
        hayDato = true;
        if (salmonella === "POSITIVO") {
            return "ROJO";
        }
    }

    // ----------------------------
    // E. COLI
    // ----------------------------
    if (ecoli !== null && ecoli !== undefined && !isNaN(ecoli)) {
        hayDato = true;
        if (ecoli > LIMITES.ecoli_max) {
            return "ROJO";
        }
    }

    // ----------------------------
    // FECALES
    // ----------------------------
    if (fecales !== null && fecales !== undefined && !isNaN(fecales)) {
        hayDato = true;
        if (fecales > LIMITES.fecales_max) {
            return "ROJO";
        }
    }

    // ----------------------------
    // TOTALES
    // ----------------------------
    if (totales !== null && totales !== undefined && !isNaN(totales)) {
        hayDato = true;

        if (totales > LIMITES.totales_max) {
            return "ROJO";
        }

        if (totales > LIMITES.totales_advertencia) {
            hayAdvertencia = true;
        }
    }

    // ----------------------------
    // RESULTADO FINAL
    // ----------------------------
    if (!hayDato) {
        return "N/A";
    }

    if (hayAdvertencia) {
        return "AMARILLO";
    }

    return "VERDE";
}

function calcularSemaforoPesticidas(valor) {
    switch (valor) {
        case 'CUMPLE':
            return 'VERDE';
        case 'BAJO_RANGO':
            return 'AMARILLO';
        case 'NO CUMPLE':
            return 'ROJO';
        default:
            return 'GRIS';
    }
}

// ============================================
// PREVIEW
// ============================================

function actualizarPreviewSemaforos() {
    const salmonella = document.getElementById('salmonella').value;
    const ecoli = parseFloat(document.getElementById('ecoli').value);
    const fecales = parseFloat(document.getElementById('fecales').value);
    const totales = parseFloat(document.getElementById('totales').value);
    const pesticidas = document.getElementById('pesticidas').value;

    if (!pesticidas) {
        document.getElementById('preview-semaforos').classList.add('hidden');
        return;
    }

    const semMicro = calcularSemaforoMicro({ salmonella, ecoli, fecales, totales });
    const semPest = calcularSemaforoPesticidas(pesticidas);

    document.getElementById('preview-micro').className =
        `semaforo ${semMicro.toLowerCase()}`;

    document.getElementById('preview-pesticidas').className =
        `semaforo ${semPest.toLowerCase()}`;

    document.getElementById('preview-semafo
