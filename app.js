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
// FUNCIONES DE CÁLCULO DE SEMÁFOROS (LÓGICA MEJORADA)
// ============================================

function calcularSemaforoMicro(data) {
    const { salmonella, ecoli, fecales, totales } = data;
    
    // 1. REGLA DE ORO: SI ALGO ESTÁ MAL, ES ROJO (Independiente de los N/A)
    if (salmonella === "POSITIVO" || 
        ecoli > LIMITES.ecoli_max || 
        fecales > LIMITES.fecales_max || 
        totales > LIMITES.totales_max) {
        return "ROJO";
    }
    
    // 2. REGLA DE ADVERTENCIA: AMARILLO
    if (totales > LIMITES.totales_advertencia) {
        return "AMARILLO";
    }
    
    // 3. REGLA DE N/A O VACÍO: GRIS
    // Solo es N/A si todo es neutro (N/A, 0 o vacío)
    const esNumeroVacio = (n) => n === 0 || n === "" || isNaN(n);
    if (salmonella === "N/A" && esNumeroVacio(ecoli) && esNumeroVacio(fecales) && esNumeroVacio(totales)) {
        return "N/A";
    }

    // 4. SI PASÓ TODO LO ANTERIOR: VERDE
    return "VERDE";
}

function calcularSemaforoPesticidas(resultado) {
    if (resultado === "BAJO_RANGO") return "AMARILLO"; // <--- ESTO TE FALTABA
    if (resultado === "NO CUMPLE") return "ROJO";
    if (resultado === "CUMPLE") return "VERDE";
    return "N/A"; // Para el caso de "N/A"
}

// ============================================
// FUNCIONES DE FIRESTORE
// ============================================

async function obtenerHistorial(cveProv) {
    try {
        const snapshot = await db.collection('registros')
            .where('cve_prov', '==', cveProv)
            .orderBy('timestamp', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error historial:", error);
        throw error;
    }
}

async function registrarAnalisis(datos) {
    try {
        const docRef = await db.collection('registros').add({
            ...datos,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error registro:", error);
        throw error;
    }
}

// ============================================
// FUNCIONES DE UI
// ============================================

function mostrarInfoProveedor(proveedor) {
    document.getElementById('prov-codigo').textContent = proveedor.cve_prov || 'N/A';
    document.getElementById('prov-nombre').textContent = proveedor.nombre || 'N/A';
    document.getElementById('prov-estado-origen').textContent = proveedor.edo_origen || '--';
    document.getElementById('prov-estatus').textContent = proveedor.activo ? '✅ Activo' : '❌ Inactivo';
    document.getElementById('proveedor-info').classList.remove('hidden');
    document.getElementById('section-historial').style.opacity = '1';
    document.getElementById('section-registro').style.opacity = '1';
}

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
        
        html += `<tr>
            <td>${reg.fecha || 'N/A'}</td>
            <td>${v(m.salmonella)}</td>
            <td>${v(m.ecoli)}</td>
            <td>${v(m.fecales)}</td>
            <td>${v(m.totales)}</td>
            <td>${v(p.resultado)}</td>
            <td><span class="semaforo ${(s.micro || 'n/a').toLowerCase()}"></span></td>
            <td><span class="semaforo ${(s.pesticidas || 'n/a').toLowerCase()}"></span></td>
        </tr>`;
    });
    container.innerHTML = html + `</tbody></table>`;
}

function actualizarPreviewSemaforos() {
    const s = document.getElementById('salmonella').value;
    const e = parseFloat(document.getElementById('ecoli').value) || 0;
    const f = parseFloat(document.getElementById('fecales').value) || 0;
    const t = parseFloat(document.getElementById('totales').value) || 0;
    const p = document.getElementById('pesticidas').value;
    
    const semaforoMicro = calcularSemaforoMicro({ salmonella: s, ecoli: e, fecales: f, totales: t });
    const semaforoPest = calcularSemaforoPesticidas(p);
    
    const pMicro = document.getElementById('preview-micro');
    const pPest = document.getElementById('preview-pesticidas');
    
    pMicro.className = `semaforo ${semaforoMicro.toLowerCase()}`;
    pPest.className = `semaforo ${semaforoPest.toLowerCase()}`;
    document.getElementById('preview-semaforos').classList.remove('hidden');
}

// ============================================
// INICIO Y EVENTOS
// ============================================

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
        const hist = await obtenerHistorial(proveedorActual.cve_prov);
        mostrarHistorial(hist);
        btn.disabled = false;
    });

    document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
        document.getElementById('modal-confirmacion').classList.add('hidden');
    });
});
