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
    
    // Convertir a números reales para comparar, si es vacío o NaN será 0
    const numEcoli = parseFloat(ecoli) || 0;
    const numFecales = parseFloat(fecales) || 0;
    const numTotales = parseFloat(totales) || 0;

    // 1. PRIORIDAD ROJA: Si uno solo está mal, TODO es rojo
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
    if (salmonella === "N/A" && numEcoli === 0 && numFecales === 0 && numTotales === 0) {
        return "n-a";
    }

    // 4. SI TODO ESTÁ LIMPIO -> VERDE
    return "verde";
}

function calcularSemaforoPesticidas(resultado) {
    // Ajustado exactamente a los valores de TU index.html
    if (resultado === "PRESENTE (BAJO RANGO)") return "amarillo"; 
    if (resultado === "NO CUMPLE") return "rojo";
    if (resultado === "CUMPLE") return "verde";
    return "n-a";
}

// ============================================
// UI Y VISTA PREVIA
// ============================================
function actualizarPreviewSemaforos() {
    const s = document.getElementById('salmonella').value;
    const e = document.getElementById('ecoli').value;
    const f = document.getElementById('fecales').value;
    const t = document.getElementById('totales').value;
    const p = document.getElementById('pesticidas').value;
    
    const semaforoMicro = calcularSemaforoMicro({ salmonella: s, ecoli: e, fecales: f, totales: t });
    const semaforoPest = calcularSemaforoPesticidas(p);
    
    const pMicro = document.getElementById('preview-micro');
    const pPest = document.getElementById('preview-pesticidas');
    
    // Cambiamos la clase para que el CSS (styles.css) lo pinte
    pMicro.className = `semaforo ${semaforoMicro}`;
    pPest.className = `semaforo ${semaforoPest}`;
    
    document.getElementById('preview-semaforos').classList.remove('hidden');
}

// ============================================
// INICIALIZACIÓN Y EVENTOS
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Carga inicial de proveedores
    await cargarProveedoresXML();
    llenarDropdownProveedores();
    
    // Fecha actual
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

    // Cambio de proveedor
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

    // Escuchar cambios en TODOS los campos para actualizar el semáforo en tiempo real
    const campos = ['salmonella', 'ecoli', 'fecales', 'totales', 'pesticidas'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', actualizarPreviewSemaforos);
            el.addEventListener('change', actualizarPreviewSemaforos);
        }
    });

    // Guardar en Firebase
    document.getElementById('form-analisis').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!proveedorActual) return alert("Selecciona un proveedor");

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;

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

        try {
            await registrarAnalisis(datos);
            document.getElementById('modal-confirmacion').classList.remove('hidden');
            document.getElementById('form-analisis').reset();
            actualizarPreviewSemaforos();
            const hist = await obtenerHistorial(proveedorActual.cve_prov);
            mostrarHistorial(hist);
        } catch (err) {
            alert("Error al guardar");
        } finally {
            btn.disabled = false;
        }
    });

    document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
        document.getElementById('modal-confirmacion').classList.add('hidden');
    });
});

// Nota: Asegúrate que mostrarHistorial use: class="semaforo ${s.micro.toLowerCase()}"
