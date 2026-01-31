// app.js - Reemplaza tu JS actual por esto (mantiene IDs que tienes en index.html)

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
let listaProveedores = [];

// ============================================
// UTIL: mapear nombres de semáforo a clases CSS
// ============================================
function semClass(semaforo) {
    if (!semaforo) return 'gris';
    const s = String(semaforo).toLowerCase();
    if (s === 'n/a' || s === 'na') return 'gris';
    if (s === 'gris') return 'gris';
    return s.replace(/\s+/g, '-'); // ejemplo "NO CUMPLE" -> "no-cumple"
}

// ============================================
// CARGA PROVEEDORES DESDE XML
// ============================================
async function cargarProveedoresXML() {
    try {
        const resp = await fetch('PROVEEDORES.xml');
        const xmlText = await resp.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const detalles = xmlDoc.getElementsByTagName('Details');

        listaProveedores = [];

        for (let i = 0; i < detalles.length; i++) {
            const d = detalles[i];
            const cveProv = d.getAttribute('Cve_Prov') || d.getAttribute('Cve_Prov'.toLowerCase());
            const nomProv = d.getAttribute('Nom_Prov') || d.getAttribute('Nom_Prov'.toLowerCase());
            const edoOrigen = d.getAttribute('Edo_Origen') || d.getAttribute('Edo_Origen'.toLowerCase());
            const estatus = d.getAttribute('Estatus') || d.getAttribute('Estatus'.toLowerCase());

            if (cveProv && cveProv !== '.' && cveProv.trim() !== '') {
                listaProveedores.push({
                    cve_prov: cveProv.trim(),
                    nombre: (nomProv || 'N/A').trim(),
                    edo_origen: (edoOrigen || '--').trim(),
                    activo: String(estatus || '').toLowerCase() === 'activo'
                });
            }
        }

        // render inicial
        llenarDropdownProveedores(listaProveedores);
    } catch (err) {
        console.error('Error cargando PROVEEDORES.xml:', err);
        alert('Error al cargar PROVEEDORES.xml. Verifica que exista en la carpeta y esté accesible.');
    }
}

// ============================================
// RENDERS Y BÚSQUEDA PROVEEDORES
// ============================================
function llenarDropdownProveedores(lista = listaProveedores) {
    const select = document.getElementById('cve-prov-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Seleccione un proveedor --</option>';

    // ordenar por nombre para que buscar por nombre tenga sentido
    const ordenados = [...lista].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

    ordenados.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.cve_prov;
        opt.textContent = `${p.cve_prov} - ${p.nombre}`;
        if (!p.activo) {
            opt.disabled = true;
            opt.textContent += ' (Desactivado)';
        }
        select.appendChild(opt);
    });
}

function filtrarProveedoresPorNombre(texto) {
    const q = (texto || '').toLowerCase();
    const filtrados = listaProveedores.filter(p =>
        (p.nombre || '').toLowerCase().includes(q) ||
        (p.cve_prov || '').toLowerCase().includes(q)
    );
    llenarDropdownProveedores(filtrados);
}

function buscarProveedorPorCodigo(cve) {
    return listaProveedores.find(p => p.cve_prov === cve);
}

// ============================================
// CÁLCULO DE SEMÁFOROS
// ============================================
function calcularSemaforoMicro({ salmonella, ecoli, fecales, totales }) {
    let hayDato = false;
    let hayAdvertencia = false;

    // Salmonella: valores esperados según tu HTML: "NEGATIVO", "POSITIVO", "N/A"
    if (salmonella && salmonella !== 'N/A') {
        hayDato = true;
        if (String(salmonella).toUpperCase() === 'POSITIVO') return 'ROJO';
    }

    // E. coli
    if (Number.isFinite(ecoli)) {
        hayDato = true;
        if (ecoli > LIMITES.ecoli_max) return 'ROJO';
    }

    // Fecales
    if (Number.isFinite(fecales)) {
        hayDato = true;
        if (fecales > LIMITES.fecales_max) return 'ROJO';
    }

    // Totales
    if (Number.isFinite(totales)) {
        hayDato = true;
        if (totales > LIMITES.totales_max) return 'ROJO';
        if (totales > LIMITES.totales_advertencia) hayAdvertencia = true;
    }

    if (!hayDato) return 'N/A';
    if (hayAdvertencia) return 'AMARILLO';
    return 'VERDE';
}

function calcularSemaforoPesticidas(valor) {
    // valores en tu HTML: "CUMPLE", "BAJO_RANGO", "NO CUMPLE", "N/A"
    if (!valor || valor === '') return 'GRIS';
    switch (valor) {
        case 'CUMPLE': return 'VERDE';
        case 'BAJO_RANGO': return 'AMARILLO';
        case 'NO CUMPLE': return 'ROJO';
        case 'N/A': return 'GRIS';
        default: return 'GRIS';
    }
}

// ============================================
// FIRESTORE: obtener historial y guardar
// (asume que config.js ya dejó global `db` y `firebase`)
// ============================================
async function obtenerHistorial(cveProv) {
    try {
        const snapshot = await db.collection('registros')
            .where('cve_prov', '==', cveProv)
            .orderBy('timestamp', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error('Error obtenerHistorial:', err);
        return [];
    }
}

async function registrarAnalisis(datos) {
    try {
        const ref = await db.collection('registros').add({
            ...datos,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    } catch (err) {
        console.error('Error registrarAnalisis:', err);
        throw err;
    }
}

// ============================================
// UI: mostrar info, historial, preview, modal
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
    if (!container) return;

    if (!registros || registros.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay registros previos para este proveedor</p>';
        return;
    }

    let html = `
    <table class="tabla-historial">
      <thead>
        <tr>
          <th>Fecha</th><th>Salmonella</th><th>E. coli</th><th>Fecales</th><th>Totales</th><th>Pesticidas</th><th>🚦 Micro</th><th>🚦 Pest</th>
        </tr>
      </thead>
      <tbody>
    `;

    registros.forEach(reg => {
        const micro = reg.microbiologia || {};
        const pest = reg.pesticidas || {};
        const sem = reg.semaforos || {};
        const mostrarValor = (v) => (v !== undefined && v !== null && v !== '') ? v : 'N/A';

        const claseMicro = semClass(sem.micro || 'N/A');
        const clasePest = semClass(sem.pesticidas || 'GRIS');

        html += `
          <tr>
            <td>${reg.fecha || 'N/A'}</td>
            <td>${mostrarValor(micro.salmonella)}</td>
            <td>${mostrarValor(micro.ecoli)}</td>
            <td>${mostrarValor(micro.fecales)}</td>
            <td>${mostrarValor(micro.totales)}</td>
            <td>${mostrarValor(pest.resultado)}</td>
            <td><span class="semaforo ${claseMicro}"></span></td>
            <td><span class="semaforo ${clasePest}"></span></td>
          </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function actualizarPreviewSemaforos() {
    const salmonella = document.getElementById('salmonella').value || 'N/A';

    const ecoliRaw = document.getElementById('ecoli').value;
    const fecalesRaw = document.getElementById('fecales').value;
    const totalesRaw = document.getElementById('totales').value;

    const pesticidas = document.getElementById('pesticidas').value || '';

    const ecoli = ecoliRaw === '' ? null : parseFloat(ecoliRaw);
    const fecales = fecalesRaw === '' ? null : parseFloat(fecalesRaw);
    const totales = totalesRaw === '' ? null : parseFloat(totalesRaw);

    // si no hay NADA, ocultar preview
    const hayAlgo = (salmonella && salmonella !== 'N/A') || ecoli !== null || fecales !== null || totales !== null || pesticidas !== '';
    if (!hayAlgo) {
        document.getElementById('preview-semaforos').classList.add('hidden');
        return;
    }

    const semMicro = calcularSemaforoMicro({ salmonella, ecoli, fecales, totales });
    const semPest = calcularSemaforoPesticidas(pesticidas);

    const previewMicro = document.getElementById('preview-micro');
    const previewPest = document.getElementById('preview-pesticidas');

    previewMicro.className = `semaforo ${semClass(semMicro)}`;
    previewPest.className = `semaforo ${semClass(semPest)}`;

    document.getElementById('preview-semaforos').classList.remove('hidden');
}

function mostrarModal() {
    document.getElementById('modal-confirmacion').classList.remove('hidden');
}
function cerrarModal() {
    document.getElementById('modal-confirmacion').classList.add('hidden');
}
function limpiarFormulario() {
    document.getElementById('form-analisis').reset();
    document.getElementById('preview-semaforos').classList.add('hidden');
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
}

// ============================================
// EVENTOS Y ARRANQUE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // cargar proveedores y render
    await cargarProveedoresXML();

    // fecha por defecto
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;

    // listeners de búsqueda y dropdown
    const inputBuscar = document.getElementById('buscar-proveedor');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => filtrarProveedoresPorNombre(e.target.value));
    }

    const selectProv = document.getElementById('cve-prov-select');
    if (selectProv) {
        selectProv.addEventListener('change', async (e) => {
            const cve = e.target.value;
            if (!cve) {
                document.getElementById('proveedor-info').classList.add('hidden');
                document.getElementById('historial-container').innerHTML = '<p class="text-muted">Seleccione un proveedor para ver su historial</p>';
                document.getElementById('section-historial').style.opacity = '0.5';
                document.getElementById('section-registro').style.opacity = '0.5';
                proveedorActual = null;
                return;
            }

            const prov = buscarProveedorPorCodigo(cve);
            if (!prov) {
                alert('Error al cargar proveedor');
                return;
            }

            proveedorActual = prov;
            mostrarInfoProveedor(prov);

            try {
                const hist = await obtenerHistorial(cve);
                mostrarHistorial(hist);
            } catch (err) {
                console.error(err);
                document.getElementById('historial-container').innerHTML = '<p class="text-muted">⚠️ Error al cargar historial</p>';
            }
        });
    }

    // listeners para preview
    ['salmonella', 'ecoli', 'fecales', 'totales', 'pesticidas'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', actualizarPreviewSemaforos);
        el.addEventListener('input', actualizarPreviewSemaforos);
    });

    // submit del formulario
    const form = document.getElementById('form-analisis');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!proveedorActual) {
                alert('⚠️ Primero debe seleccionar un proveedor');
                return;
            }

            const salmonella = document.getElementById('salmonella').value || 'N/A';
            const ecoliRaw = document.getElementById('ecoli').value;
            const fecalesRaw = document.getElementById('fecales').value;
            const totalesRaw = document.getElementById('totales').value;
            const pesticidas = document.getElementById('pesticidas').value || '';

            const ecoli = ecoliRaw === '' ? null : parseFloat(ecoliRaw);
            const fecales = fecalesRaw === '' ? null : parseFloat(fecalesRaw);
            const totales = totalesRaw === '' ? null : parseFloat(totalesRaw);

            const semMicro = calcularSemaforoMicro({ salmonella, ecoli, fecales, totales });
            const semPest = calcularSemaforoPesticidas(pesticidas);

            const datos = {
                cve_prov: proveedorActual.cve_prov,
                fecha: document.getElementById('fecha').value,
                microbiologia: { salmonella, ecoli, fecales, totales },
                pesticidas: { resultado: pesticidas },
                semaforos: { micro: semMicro, pesticidas: semPest }
            };

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Guardando...';

            try {
                await registrarAnalisis(datos);
                mostrarModal();
                limpiarFormulario();
                const hist = await obtenerHistorial(proveedorActual.cve_prov);
                mostrarHistorial(hist);
            } catch (err) {
                console.error(err);
                alert('❌ Error al guardar. Revisa la conexión a Firebase.');
            } finally {
                btn.disabled = false;
                btn.textContent = '✅ Guardar Análisis';
            }
        });
    }

    // modal
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
    const modal = document.getElementById('modal-confirmacion');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'modal-confirmacion') cerrarModal();
        });
    }
});
