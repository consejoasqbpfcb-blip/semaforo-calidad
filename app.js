// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

/**
 * Calcula el semáforo de microbiología
 * Permite que algunos parámetros estén en N/A
 * NO invalida el análisis si otros sí fueron medidos
 */
function calcularSemaforoMicro(data) {
    const { salmonella, ecoli, fecales, totales } = data;

    let hayDato = false;        // Se activa si AL MENOS un análisis existe
    let hayAdvertencia = false; // Para amarillos

    // ----------------------------
    // SALMONELLA
    // ----------------------------
    if (salmonella && salmonella !== "N/A") {
        hayDato = true;
        if (salmonella === "POSITIVO") {
            return "ROJO"; // Salmonella positiva siempre es crítica
        }
    }

    // ----------------------------
    // E. COLI
    // ----------------------------
    if (ecoli !== null && ecoli !== undefined && ecoli !== "") {
        hayDato = true;
        if (ecoli > LIMITES.ecoli_max) {
            return "ROJO"; // E. coli alto manda aunque Salmonella sea N/A
        }
    }

    // ----------------------------
    // COLIFORMES FECALES
    // ----------------------------
    if (fecales !== null && fecales !== undefined && fecales !== "") {
        hayDato = true;
        if (fecales > LIMITES.fecales_max) {
            return "ROJO";
        }
    }

    // ----------------------------
    // COLIFORMES TOTALES
    // ----------------------------
    if (totales !== null && totales !== undefined && totales !== "") {
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
        return "N/A"; // Nada fue medido
    }

    if (hayAdvertencia) {
        return "AMARILLO";
    }

    return "VERDE";
}


// Estado global de la aplicación
let proveedorActual = null;

// ============================================
// FUNCIONES DE CÁLCULO DE SEMÁFOROS
// ============================================

/**
 * Calcula el semáforo de microbiología
 * @param {Object} data - Datos de microbiología {salmonella, ecoli, fecales, totales}
 * @returns {string} - "VERDE", "AMARILLO", "ROJO", o "N/A"
 */
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
    if (ecoli !== null && ecoli !== undefined && ecoli !== "") {
        hayDato = true;
        if (ecoli > LIMITES.ecoli_max) {
            return "ROJO";
        }
    }

    // ----------------------------
    // COLIFORMES FECALES
    // ----------------------------
    if (fecales !== null && fecales !== undefined && fecales !== "") {
        hayDato = true;
        if (fecales > LIMITES.fecales_max) {
            return "ROJO";
        }
    }

    // ----------------------------
    // COLIFORMES TOTALES
    // ----------------------------
    if (totales !== null && totales !== undefined && totales !== "") {
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
        return "N/A"; // nada se midió
    }

    if (hayAdvertencia) {
        return "AMARILLO";
    }

    return "VERDE";
}


/**
 * Calcula el semáforo de pesticidas
 * @param {string} resultado - "CUMPLE", "NO CUMPLE", o "N/A"
 * @returns {string} - "VERDE", "ROJO", o "N/A"
/**
 * Calcula el semáforo de pesticidas
 * @param {string} valor - "CUMPLE", "BAJO_RANGO", "NO CUMPLE", "N/A"
 * @returns {string} - "VERDE", "AMARILLO", "ROJO", "GRIS"
 */
function calcularSemaforoPesticidas(valor) {
    switch (valor) {
        case 'CUMPLE':
            return 'VERDE';

        case 'BAJO_RANGO':
            return 'AMARILLO';

        case 'NO CUMPLE':
            return 'ROJO';

        case 'N/A':
        default:
            return 'GRIS';
    }
}


// ============================================
// FUNCIONES DE FIRESTORE
// ============================================

/**
 * Obtiene el historial de registros de un proveedor
 * @param {string} cveProv - Código del proveedor
 * @returns {Promise<Array>} - Array de registros ordenados por fecha
 */
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

/**
 * Registra un nuevo análisis en Firestore
 * @param {Object} datos - Datos del análisis
 * @returns {Promise<string>} - ID del documento creado
 */
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
// FUNCIONES DE UI
// ============================================

/**
 * Muestra información del proveedor en la UI
 * @param {Object} proveedor - Datos del proveedor
 */
function mostrarInfoProveedor(proveedor) {
    document.getElementById('prov-codigo').textContent = proveedor.cve_prov || 'N/A';
    document.getElementById('prov-nombre').textContent = proveedor.nombre || 'N/A';
    document.getElementById('prov-estado-origen').textContent = proveedor.edo_origen || '--';
    document.getElementById('prov-estatus').textContent = proveedor.activo ? '✅ Activo' : '❌ Inactivo';
    document.getElementById('proveedor-info').classList.remove('hidden');
    
    // Habilitar secciones
    document.getElementById('section-historial').style.opacity = '1';
    document.getElementById('section-registro').style.opacity = '1';
}

/**
 * Muestra el historial en una tabla
 * @param {Array} registros - Array de registros
 */
function mostrarHistorial(registros) {
    const container = document.getElementById('historial-container');
    
    if (registros.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay registros previos para este proveedor</p>';
        return;
    }
    
    let html = `
        <table class="tabla-historial">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Salmonella</th>
                    <th>E. coli</th>
                    <th>Fecales</th>
                    <th>Totales</th>
                    <th>Pesticidas</th>
                    <th>🚦 Micro</th>
                    <th>🚦 Pest</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    registros.forEach(reg => {
        const micro = reg.microbiologia || {};
        const pest = reg.pesticidas || {};
        const sem = reg.semaforos || {};
        
        // Función para mostrar valores o N/A
        const mostrarValor = (val) => (val !== undefined && val !== null && val !== '') ? val : 'N/A';
        
        html += `
            <tr>
                <td>${reg.fecha || 'N/A'}</td>
                <td>${mostrarValor(micro.salmonella)}</td>
                <td>${mostrarValor(micro.ecoli)}</td>
                <td>${mostrarValor(micro.fecales)}</td>
                <td>${mostrarValor(micro.totales)}</td>
                <td>${mostrarValor(pest.resultado)}</td>
                <td><span class="semaforo ${(sem.micro || 'n/a').toLowerCase().replace('/', '-')}"></span></td>
                <td><span class="semaforo ${(sem.pesticidas || 'n/a').toLowerCase().replace('/', '-')}"></span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

/**
 * Actualiza la vista previa de semáforos
 */
function actualizarPreviewSemaforos() {
    const salmonella = document.getElementById('salmonella').value;
    const ecoli = parseFloat(document.getElementById('ecoli').value) || 0;
    const fecales = parseFloat(document.getElementById('fecales').value) || 0;
    const totales = parseFloat(document.getElementById('totales').value) || 0;
    const pesticidas = document.getElementById('pesticidas').value;
    
    // Solo mostrar si hay datos suficientes
    if (!salmonella || !pesticidas) {
        document.getElementById('preview-semaforos').classList.add('hidden');
        return;
    }
    
    // Calcular semáforos
    const semaforoMicro = calcularSemaforoMicro({ salmonella, ecoli, fecales, totales });
    const semaforoPest = calcularSemaforoPesticidas(pesticidas);
    
    // Actualizar UI
    const previewMicro = document.getElementById('preview-micro');
    const previewPest = document.getElementById('preview-pesticidas');
    
    previewMicro.className = `semaforo ${semaforoMicro.toLowerCase().replace('/', '-')}`;
    previewPest.className = `semaforo ${semaforoPest.toLowerCase().replace('/', '-')}`;
    
    document.getElementById('preview-semaforos').classList.remove('hidden');
}

/**
 * Muestra el modal de confirmación
 */
function mostrarModal() {
    document.getElementById('modal-confirmacion').classList.remove('hidden');
}

/**
 * Cierra el modal de confirmación
 */
function cerrarModal() {
    document.getElementById('modal-confirmacion').classList.add('hidden');
}

/**
 * Limpia el formulario de análisis
 */
function limpiarFormulario() {
    document.getElementById('form-analisis').reset();
    document.getElementById('preview-semaforos').classList.add('hidden');
    
    // Establecer fecha actual por defecto
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    
    // ========================================
    // CARGAR PROVEEDORES DESDE XML
    // ========================================
    await cargarProveedoresXML();
    llenarDropdownProveedores();
    
    // Establecer fecha actual por defecto
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
    
    // Deshabilitar secciones hasta seleccionar proveedor
    document.getElementById('section-historial').style.opacity = '0.5';
    document.getElementById('section-registro').style.opacity = '0.5';
    
    // ========================================
    // SELECCIONAR PROVEEDOR DEL DROPDOWN
    // ========================================
    document.getElementById('cve-prov-select').addEventListener('change', async (e) => {
        const cveProv = e.target.value;
        
        if (!cveProv) {
            // Si no hay selección, ocultar todo
            document.getElementById('proveedor-info').classList.add('hidden');
            document.getElementById('historial-container').innerHTML = '<p class="text-muted">Seleccione un proveedor para ver su historial</p>';
            document.getElementById('section-historial').style.opacity = '0.5';
            document.getElementById('section-registro').style.opacity = '0.5';
            proveedorActual = null;
            return;
        }
        
        // Buscar proveedor en el XML
        const proveedor = buscarProveedorPorCodigo(cveProv);
        
        if (!proveedor) {
            alert('❌ Error al cargar información del proveedor');
            return;
        }
        
        // Guardar proveedor actual
        proveedorActual = proveedor;
        
        // Mostrar información
        mostrarInfoProveedor(proveedor);
        
        // Cargar historial desde Firebase
        try {
            const historial = await obtenerHistorial(cveProv);
            mostrarHistorial(historial);
        } catch (error) {
            console.error('Error al cargar historial:', error);
            document.getElementById('historial-container').innerHTML = '<p class="text-muted">⚠️ Error al cargar historial</p>';
        }
    });
    
    // ========================================
    // ACTUALIZAR PREVIEW DE SEMÁFOROS
    // ========================================
    const camposAnalisis = ['salmonella', 'ecoli', 'fecales', 'totales', 'pesticidas'];
    camposAnalisis.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            elemento.addEventListener('change', actualizarPreviewSemaforos);
            elemento.addEventListener('input', actualizarPreviewSemaforos);
        }
    });
    
    // ========================================
    // SUBMIT DEL FORMULARIO
    // ========================================
    document.getElementById('form-analisis').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!proveedorActual) {
            alert('⚠️ Primero debe seleccionar un proveedor');
            return;
        }
        
        // Recopilar datos del formulario
        const salmonella = document.getElementById('salmonella').value;
        const ecoli = parseFloat(document.getElementById('ecoli').value);
        const fecales = parseFloat(document.getElementById('fecales').value);
        const totales = parseFloat(document.getElementById('totales').value);
        const pesticidas = document.getElementById('pesticidas').value;
        const fecha = document.getElementById('fecha').value;
        
        // Calcular semáforos
        const semaforoMicro = calcularSemaforoMicro({ salmonella, ecoli, fecales, totales });
        const semaforoPest = calcularSemaforoPesticidas(pesticidas);
        
        // Construir objeto de datos
        const datos = {
            cve_prov: proveedorActual.cve_prov,
            fecha: fecha,
            microbiologia: {
                salmonella: salmonella,
                ecoli: ecoli,
                fecales: fecales,
                totales: totales
            },
            pesticidas: {
                resultado: pesticidas
            },
            semaforos: {
                micro: semaforoMicro,
                pesticidas: semaforoPest
            }
        };
        
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Guardando...';
        
        try {
            await registrarAnalisis(datos);
            
            // Mostrar confirmación
            mostrarModal();
            
            // Limpiar formulario
            limpiarFormulario();
            
            // Recargar historial
            const historial = await obtenerHistorial(proveedorActual.cve_prov);
            mostrarHistorial(historial);
            
        } catch (error) {
            alert('❌ Error al guardar el análisis. Revise la conexión a Firebase.');
            console.error(error);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = '✅ Guardar Análisis';
        }
    });
    
    // ========================================
    // CERRAR MODAL
    // ========================================
    document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('modal-confirmacion').addEventListener('click', (e) => {
        if (e.target.id === 'modal-confirmacion') {
            cerrarModal();
        }
    });
});
