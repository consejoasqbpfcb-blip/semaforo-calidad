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
// LÓGICA DE SEMÁFOROS (INDEPENDIENTE Y ESTRICTA)
// ============================================
function calcularSemaforoMicro(data) {
    const { salmonella, ecoli, fecales, totales } = data;
    
    const numEcoli = parseFloat(ecoli) || 0;
    const numFecales = parseFloat(fecales) || 0;
    const numTotales = parseFloat(totales) || 0;

    // 1. PRIORIDAD ROJA: Si uno solo falla, TODO es rojo
    if (salmonella === "POSITIVO" || 
        numEcoli > LIMITES.ecoli_max || 
        numFecales > LIMITES.fecales_max || 
        numTotales > LIMITES.totales_max) {
        return "rojo"; 
    }
    
    // 2. PRIORIDAD AMARILLA: Advertencia por recuento alto
    if (numTotales > LIMITES.totales_advertencia) {
        return "amarillo";
    }
    
    // 3. PRIORIDAD GRIS (N/A): Solo si no hay datos de nada
    const esVacio = (val) => val === "N/A" || val === "" || val === 0 || isNaN(val);
    if (salmonella === "N/A" && esVacio(numEcoli) && esVacio(numFecales) && esVacio(numTotales)) {
        return "n-a";
    }

    // 4. SI TODO ESTÁ DENTRO DE RANGO -> VERDE
    return "verde";
}

function calcularSemaforoPesticidas(resultado) {
    // Sincronizado con los <option> de tu index.html
    if (resultado === "PRESENTE (BAJO RANGO)") return "amarillo"; 
    if (resultado === "NO CUMPLE") return "rojo";
    if (resultado === "CUMPLE") return "verde";
    return "n-a";
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
            <td><span class="semaforo ${(s.micro || 'n-a').toLowerCase()}"></span></td>
            <td><span class="semaforo ${(s.pesticidas || 'n-a').toLowerCase()}"></span></td>
        </tr>`;
    });
    container.innerHTML = html + `</tbody></table>`;
}

function actualizarPreviewSemaforos() {
    const s = document.getElementById('salmonella').value;
    const e = document.getElementById('ecoli').value;
    const f = document.getElementById('fecales').value;
    const t = document.getElementById('totales').value;
    const p = document.getElementById('pesticidas').value;
    
    const semaforoMicro = calcularSemaforoMicro({ salmonella: s, ecoli: e, fecales: f, totales: t });
    const semaforoPest = calcularSemaforoPesticidas(p);
    
    document.getElementById('preview-micro').className = `semaforo ${semaforoMicro}`;
    document.getElementById('preview-pesticidas').className = `semaforo ${semaforoPest}`;
    document.getElementById('preview-semaforos').classList.remove('hidden');
}

// ============================================
// INICIALIZACIÓN Y EVENTOS
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar proveedores del XML
    await cargarProveedoresXML();
    llenarDropdownProveedores();
    
    // 2. Fecha por defecto
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

    // 3. Evento de selección de proveedor (Dropdown)
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
            const historial = await obtenerHistorial(cveProv);
            mostrarHistorial(historial);
        }
    });

    // 4. Listeners para vista previa en tiempo real
    ['salmonella', 'ecoli', 'fecales', 'totales', 'pesticidas'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', actualizarPreviewSemaforos);
            el.addEventListener('change', actualizarPreviewSemaforos);
        }
    });

    // 5. Envío de formulario a Firebase
    document.getElementById('form-analisis').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!proveedorActual) return alert('Por favor, selecciona un proveedor.');

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;

        const s = document.getElementById('salmonella').value;
        const e_v = parseFloat(document.getElementById('ecoli').value) || 0;
        const f_v = parseFloat(document.getElementById('fecales').value) || 0;
        const t_v = parseFloat(document.getElementById('totales').value) || 0;
        const p_v = document.getElementById('pesticidas').value;

        const datos = {
            cve_prov: proveedorActual.cve_prov,
            fecha: document.getElementById('fecha').value,
            microbiologia: { salmonella: s, ecoli: e_v, fecales: f_v, totales: t_v },
            pesticidas: { resultado: p_v },
            semaforos: {
                micro: calcularSemaforoMicro({ salmonella: s, ecoli: e_v, fecales: f_v, totales: t_v }),
                pesticidas: calcularSemaforoPesticidas(p_v)
            }
        };

        try {
            await registrarAnalisis(datos);
            document.getElementById('modal-confirmacion').classList.remove('hidden');
            document.getElementById('form-analisis').reset();
            document.getElementById('preview-semaforos').classList.add('hidden');
            const historial = await obtenerHistorial(proveedorActual.cve_prov);
            mostrarHistorial(historial);
        } catch (error) {
            alert('Error al guardar en la base de datos.');
        } finally {
            btn.disabled = false;
        }
    });

    // Modal
    document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
        document.getElementById('modal-confirmacion').classList.add('hidden');
    });
});
