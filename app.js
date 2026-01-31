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
// SEMÁFORO MICROBIOLÓGICO (VERSIÓN CORRECTA)
// ============================================

function calcularSemaforoMicro(data) {
    const { salmonella, ecoli, fecales, totales } = data;

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
    if (Number.isFinite(ecoli)) {
        hayDato = true;
        if (ecoli > LIMITES.ecoli_max) {
            return "ROJO";
        }
    }

    // ----------------------------
    // FECALES
    // ----------------------------
    if (Number.isFinite(fecales)) {
        hayDato = true;
        if (fecales > LIMITES.fecales_max) {
            return "ROJO";
        }
    }

    // ----------------------------
    // TOTALES
    // ----------------------------
    if (Number.isFinite(totales)) {
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
