// ============================================
// CARGA DE PROVEEDORES DESDE XML
// ============================================

let listaProveedores = [];

/**
 * Carga el archivo XML de proveedores
 */
async function cargarProveedoresXML() {
    try {
        const response = await fetch('PROVEEDORES.xml');
        const xmlText = await response.text();
        
        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Obtener todos los elementos <Details>
        const detalles = xmlDoc.getElementsByTagName('Details');
        
        listaProveedores = [];
        
        for (let i = 0; i < detalles.length; i++) {
            const detalle = detalles[i];
            const cveProv = detalle.getAttribute('Cve_Prov');
            const nomProv = detalle.getAttribute('Nom_Prov');
            const edoOrigen = detalle.getAttribute('Edo_Origen');
            const estatus = detalle.getAttribute('Estatus');
            
            // Solo agregar si tiene código válido y está activo
            if (cveProv && cveProv !== '.' && cveProv !== '') {
                listaProveedores.push({
                    cve_prov: cveProv,
                    nombre: nomProv || 'N/A',
                    edo_origen: edoOrigen || '--',
                    activo: estatus === 'Activo'
                });
            }
        }
        
        console.log(`✅ Cargados ${listaProveedores.length} proveedores desde XML`);
        return listaProveedores;
        
    } catch (error) {
        console.error('❌ Error al cargar XML:', error);
        alert('Error al cargar lista de proveedores. Verifique que PROVEEDORES.xml esté en la carpeta.');
        return [];
    }
}

/**
 * Llena el dropdown con los proveedores del XML
 */
function llenarDropdownProveedores() {
    const select = document.getElementById('cve-prov-select');
    
    // Limpiar opciones existentes (excepto la primera)
    select.innerHTML = '<option value="">-- Seleccione un proveedor --</option>';
    
    // Ordenar alfabéticamente por código
    const proveedoresOrdenados = listaProveedores.sort((a, b) => 
        a.cve_prov.localeCompare(b.cve_prov)
    );
    
    // Agregar opciones
    proveedoresOrdenados.forEach(prov => {
        const option = document.createElement('option');
        option.value = prov.cve_prov;
        option.textContent = `${prov.cve_prov} - ${prov.nombre}`;
        
        // Deshabilitar si está inactivo
        if (!prov.activo) {
            option.disabled = true;
            option.textContent += ' (Desactivado)';
        }
        
        select.appendChild(option);
    });
}

/**
 * Busca un proveedor por su código
 */
function buscarProveedorPorCodigo(cveProv) {
    return listaProveedores.find(p => p.cve_prov === cveProv);
}
