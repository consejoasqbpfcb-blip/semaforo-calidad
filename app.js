// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================
const LIMITES = {
    ecoli_max: 10,             
    fecales_max: 10,           
    totales_advertencia: 100,  
    totales_max: 1000          
};

let proveedorActual = null;

// ============================================
// LÓGICA DE SEMÁFOROS (INDEPENDIENTE)
// ============================================
function calcularSemaforoMicro(data) {
    const { salmonella, ecoli, fecales, totales } = data;
    
    // 1. SI ALGO ESTÁ FUERA DE RANGO -> ROJO INMEDIATO
    // No importa si lo demás es N/A o 0
    if (salmonella === "POSITIVO" || 
        ecoli > LIMITES.ecoli_max || 
        fecales > LIMITES.fecales_max || 
        totales > LIMITES.totales_max) {
        return "rojo"; 
    }
    
    // 2. ADVERTENCIA -> AMARILLO
    if (totales > LIMITES.totales_advertencia) {
        return "amarillo";
    }
    
    // 3. CASO N/A (Solo si TODO es vacío o N/A)
    const esVacio = (n) => n === 0 || n === "" || isNaN(n) || n === null;
    if (salmonella === "N/A" && esVacio(ecoli) && esVacio(fecales) && esVacio(totales)) {
        return "n-a";
    }

    // 4. SI NADA FALLÓ -> VERDE
    return "verde";
}

function calcularSemaforoPesticidas(resultado) {
    // Coincidir con los IDs de tu index.html
    if (resultado === "BAJO_RANGO") return "amarillo"; 
    if (resultado === "NO CUMPLE") return "rojo";
    if (resultado === "CUMPLE") return "verde";
    return "n-a";
}

// ============================================
// UI Y EVENTOS
// ============================================

function mostrarHistorial(registros) {
    const container = document.getElementById('historial-container');
    if (registros.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay registros previos</p>';
        return;
    }
    
    let html = `<table class="tabla-historial"><thead><tr>
        <th>Fecha</th><th>Salmonella</th><th>E. coli</th><th>Fecales</th><th>Totales</th><th>Pesticidas</th><th>🚦 Micro</th><th>🚦 Pest</th>
    </tr></thead><tbody>`;
    
    registros.forEach(reg => {
        const m = reg.microbiologia || {};
        const p = reg.pesticidas || {};
        const s = reg.semaforos || {};
        const v = (val) => (val !== undefined && val !== null && val !== '') ? val : 'N/A';
        
        // Aquí forzamos que use las clases correctas del CSS
        html += `<tr>
            <td>${reg.fecha || 'N/A'}</td>
            <td>${v(m.salmonella)}</td>
            <td>${v(m.ecoli)}</td>
            <td>${v(m.fecales)}</td>
            <td>${v(m.totales)}</td>
            <td>${v(p.resultado)}</td>
            <td><span class="semaforo ${s.micro ? s.micro.toLowerCase() : 'n-a'}"></span></td>
            <td><span class="semaforo ${s.pesticidas ? s.pesticidas.toLowerCase() : 'n-a'}"></span></td>
        </tr>`;
    });
    container.innerHTML = html + `</tbody></table>`;
}

function actualizarPreviewSemaforos() {
    const s = document.getElementById('salmonella').value;
    const e = parseFloat(document.getElementById('ecoli').value);
    const f = parseFloat(document.getElementById('fecales').value);
    const t = parseFloat(document.getElementById('totales').value);
    const p = document.getElementById('pesticidas').value;
    
    const semaforoMicro = calcularSemaforoMicro({ salmonella: s, ecoli: e, fecales: f, totales: t });
    const semaforoPest = calcularSemaforoPesticidas(p);
    
    const pMicro = document.getElementById('preview-micro');
    const pPest = document.getElementById('preview-pesticidas');
    
    // Limpiar clases anteriores y poner la nueva
    pMicro.className = `semaforo ${semaforoMicro}`;
    pPest.className = `semaforo ${semaforoPest}`;
    
    document.getElementById('preview-semaforos').classList.remove('hidden');
}

// ... (Resto de funciones registrarAnalisis y obtenerHistorial se mantienen igual)

document.addEventListener('DOMContentLoaded', async () => {
    await cargarProveedoresXML();
    llenarDropdownProveedores();
    
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

    document.getElementById('cve-prov-select').addEventListener('change', async (e) => {
        const cve = e.target.value;
        if (!cve) return;
        const prov = buscarProveedorPorCodigo(cve);
        if (prov) {
            proveedorActual = prov;
            mostrarInfoProveedor(prov);
            const hist = await obtenerHistorial(cve);
            mostrarHistorial(hist);
        }
    });

    ['salmonella', 'ecoli', 'fecales', 'totales', 'pesticidas'].forEach(id => {
        document.getElementById(id).addEventListener('input', actualizarPreviewSemaforos);
        document.getElementById(id).addEventListener('change', actualizarPreviewSemaforos);
    });

    document.getElementById('form-analisis').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!proveedorActual) return;

        const s = document.getElementById('salmonella').value;
        const e_val = parseFloat(document.getElementById('ecoli').value) || 0;
        const f_val = parseFloat(document.getElementById('fecales').value) || 0;
        const t_val = parseFloat(document.getElementById('totales').value) || 0;
        const p_val = document.getElementById('pesticidas').value;

        const datos = {
            cve_prov: proveedorActual.cve_prov,
            fecha: document.getElementById('fecha').value,
            microbiologia: { salmonella: s, ecoli: e_val, fecales: f_val, totales: t_val },
            pesticidas: { resultado: p_val },
            semaforos: {
                micro: calcularSemaforoMicro({ salmonella: s, ecoli: e_val, fecales: f_val, totales: t_val }),
                pesticidas: calcularSemaforoPesticidas(p_val)
            }
        };

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        await registrarAnalisis(datos);
        document.getElementById('modal-confirmacion').classList.remove('hidden');
        document.getElementById('form-analisis').reset();
        actualizarPreviewSemaforos(); // Reset preview
        const hist = await obtenerHistorial(proveedorActual.cve_prov);
        mostrarHistorial(hist);
        btn.disabled = false;
    });

    document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
        document.getElementById('modal-confirmacion').classList.add('hidden');
    });
});
