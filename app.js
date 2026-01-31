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
// FUNCIONES DE CÁLCULO DE SEMÁFOROS (CORREGIDO)
// ============================================

function calcularSemaforoMicro(data) {
    const { salmonella, ecoli, fecales, totales } = data;
    
    // 1. Prioridad Máxima: ROJO (Si algo sale mal, no importa el resto)
    if (salmonella === "POSITIVO" || 
        ecoli > LIMITES.ecoli_max || 
        fecales > LIMITES.fecales_max || 
        totales > LIMITES.totales_max) {
        return "ROJO";
    }
    
    // 2. Prioridad Media: AMARILLO (Advertencia por totales)
    if (totales > LIMITES.totales_advertencia) {
        return "AMARILLO";
    }
    
    // 3. Evaluar si todo es N/A para poner GRIS
    // Si salmonella es N/A y los números son 0 o vacíos, entonces es N/A
    if (salmonella === "N/A" && !ecoli && !fecales && !totales) {
        return "N/A";
    }

    // 4. Si pasó los filtros de arriba, está limpio
    return "VERDE";
}

function calcularSemaforoPesticidas(resultado) {
    if (resultado === "N/A") return "N/A";
    return resultado === "CUMPLE" ? "VERDE" : "ROJO";
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
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error al obtener historial:", error);
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
        console.error("Error al registrar análisis:", error);
        throw error;
    }
}

// ============================================
// FUNCIONES DE INTERFAZ (UI)
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
        container.innerHTML = '<p class="text-muted">No hay registros previos para este proveedor</p>';
        return;
    }
    
    let html = `<table class="tabla-historial"><thead><tr>
        <th>Fecha</th><th>Salmonella</th><th>E. coli</th><th>Fecales</th><th>Totales</th><th>Pesticidas</th><th>🚦 Micro</th><th>🚦 Pest</th>
    </tr></thead><tbody>`;
    
    registros.forEach(reg => {
        const micro = reg.microbiologia || {};
        const pest = reg.pesticidas || {};
        const sem = reg.semaforos || {};
        const mostrarV = (v) => (v !== undefined && v !== null && v !== '') ? v : 'N/A';
        
        html += `<tr>
            <td>${reg.fecha || 'N/A'}</td>
            <td>${mostrarV(micro.salmonella)}</td>
            <td>${mostrarV(micro.ecoli)}</td>
            <td>${mostrarV(micro.fecales)}</td>
            <td>${mostrarV(micro.totales)}</td>
            <td>${mostrarV(pest.resultado)}</td>
            <td><span class="semaforo ${(sem.micro || 'n/a').toLowerCase()}"></span></td>
            <td><span class="semaforo ${(sem.pesticidas || 'n/a').toLowerCase()}"></span></td>
        </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function actualizarPreviewSemaforos() {
    const salmonella = document.getElementById('salmonella').value;
    const ecoli = parseFloat(document.getElementById('ecoli').value) || 0;
    const fecales = parseFloat(document.getElementById('fecales').value) || 0;
    const totales = parseFloat(document.getElementById('totales').value) || 0;
    const pesticidas = document.getElementById('pesticidas').value;
    
    // Mostramos preview si al menos hay algo seleccionado
    if (!salmonella && !pesticidas) return;
    
    const semaforoMicro = calcularSemaforoMicro({ salmonella, ecoli, fecales, totales });
    const semaforoPest = calcularSemaforoPesticidas(pesticidas);
    
    const previewMicro = document.getElementById('preview-micro');
    const previewPest = document.getElementById('preview-pesticidas');
    
    previewMicro.className = `semaforo ${semaforoMicro.toLowerCase()}`;
    previewPest.className = `semaforo ${semaforoPest.toLowerCase()}`;
    document.getElementById('preview-semaforos').classList.remove('hidden');
}

function mostrarModal() { document.getElementById('modal-confirmacion').classList.remove('hidden'); }
function cerrarModal() { document.getElementById('modal-confirmacion').classList.add('hidden'); }

function limpiarFormulario() {
    document.getElementById('form-analisis').reset();
    document.getElementById('preview-semaforos').classList.add('hidden');
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
}

// ============================================
// EVENT LISTENERS (Lógica de Arranque)
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar datos iniciales
    await cargarProveedoresXML();
    llenarDropdownProveedores();
    
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('section-historial').style.opacity = '0.5';
    document.getElementById('section-registro').style.opacity = '0.5';

    // 2. SELECCIÓN DE PROVEEDOR
    document.getElementById('cve-prov-select').addEventListener('change', async (e) => {
        const cveProv = e.target.value;
        if (!cveProv) {
            document.getElementById('proveedor-info').classList.add('hidden');
            proveedorActual = null;
            return;
        }
        
        const proveedor = buscarProveedorPorCodigo(cveProv);
        if (proveedor) {
            proveedorActual = proveedor;
            mostrarInfoProveedor(proveedor);
            try {
                const historial = await obtenerHistorial(cveProv);
                mostrarHistorial(historial);
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });

    // 3. PREVIEW DE SEMÁFOROS (Actualiza al escribir)
    ['salmonella', 'ecoli', 'fecales', 'totales', 'pesticidas'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', actualizarPreviewSemaforos);
            el.addEventListener('input', actualizarPreviewSemaforos);
        }
    });

    // 4. GUARDAR ANÁLISIS
    document.getElementById('form-analisis').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!proveedorActual) return alert('Seleccione un proveedor');

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true; 
        btn.textContent = 'Guardando...';

        const s_val = document.getElementById('salmonella').value;
        const e_val = parseFloat(document.getElementById('ecoli').value) || 0;
        const f_val = parseFloat(document.getElementById('fecales').value) || 0;
        const t_val = parseFloat(document.getElementById('totales').value) || 0;
        const p_val = document.getElementById('pesticidas').value;

        const datos = {
            cve_prov: proveedorActual.cve_prov,
            fecha: document.getElementById('fecha').value,
            microbiologia: { salmonella: s_val, ecoli: e_val, fecales: f_val, totales: t_val },
            pesticidas: { resultado: p_val },
            semaforos: {
                micro: calcularSemaforoMicro({ salmonella: s_val, ecoli: e_val, fecales: f_val, totales: t_val }),
                pesticidas: calcularSemaforoPesticidas(p_val)
            }
        };

        try {
            await registrarAnalisis(datos);
            mostrarModal();
            limpiarFormulario();
            const historial = await obtenerHistorial(proveedorActual.cve_prov);
            mostrarHistorial(historial);
        } catch (error) {
            alert('Error al guardar');
        } finally {
            btn.disabled = false; 
            btn.textContent = '✅ Guardar Análisis';
        }
    });

    document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);
});
