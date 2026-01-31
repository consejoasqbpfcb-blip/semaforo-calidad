# 🌱 Sistema de Control de Calidad - Proveedores Agrícolas

Sistema web para control de calidad de proveedores agrícolas con Firebase y GitHub Pages.

## 📋 Características

- ✅ Validación de proveedores por código
- 📊 Historial completo de análisis
- 🚦 Cálculo automático de semáforos (microbiología y pesticidas)
- 💾 Almacenamiento en Firebase Firestore
- 📱 Diseño responsive
- 🚀 Desplegado en GitHub Pages

## 🔧 Configuración

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto (o usa uno existente)
3. Ve a **Firestore Database** → **Create Database**
4. Selecciona modo **Production** → Elige ubicación
5. Ve a **Rules** y pega:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Publica las reglas

### 2. Obtener credenciales de Firebase

1. En Firebase Console, ve a **Project Settings** (ícono de engranaje)
2. Baja a **Your apps** → Click en el ícono `</>`  (Web)
3. Registra tu app con un nombre (ej: "Control Calidad")
4. Copia los valores de `firebaseConfig`

### 3. Configurar `config.js`

Edita el archivo `config.js` y reemplaza con tus credenciales:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

### 4. Crear colecciones en Firestore

#### Colección: `proveedores`

1. Ve a Firestore Database → **Start collection**
2. Collection ID: `proveedores`
3. Crea documentos con esta estructura:

**Document ID:** `P001` (usar el código del proveedor)

**Fields:**
```
nombre: "RANCHO AGRICOLA LAS CABRAS SPR DE RL"
numeroSerie: "12345"
activo: true
```

Repite para cada proveedor usando su código como Document ID.

#### Colección: `registros`

Esta colección se crea automáticamente cuando guardas el primer análisis.

## 🚀 Desplegar en GitHub Pages

### Opción 1: GitHub Desktop / Web Interface

1. Crea un nuevo repositorio en GitHub
2. Sube estos archivos:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.js` (con tus credenciales de Firebase)

3. Ve a **Settings** → **Pages**
4. En **Source**, selecciona `main` branch
5. Click en **Save**
6. Tu sitio estará en: `https://TU_USUARIO.github.io/TU_REPO/`

### Opción 2: Git Command Line

```bash
# Inicializar repositorio
git init
git add .
git commit -m "Sistema de control de calidad inicial"

# Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

Luego activa GitHub Pages desde Settings.

## 📊 Estructura de Datos

### Proveedor (en Firestore)

```javascript
{
  // Document ID = código del proveedor (ej: "P001")
  nombre: "Nombre del proveedor",
  numeroSerie: "12345",
  activo: true
}
```

### Registro de Análisis

```javascript
{
  cve_prov: "P001",
  fecha: "2025-01-31",
  microbiologia: {
    salmonella: "NEGATIVO",
    fecales: 5,
    totales: 80
  },
  pesticidas: {
    resultado: "CUMPLE"
  },
  semaforos: {
    micro: "VERDE",
    pesticidas: "VERDE"
  },
  timestamp: [Firestore Timestamp]
}
```

## 🚦 Reglas de Semáforos

### Microbiología

- **ROJO**: Salmonella POSITIVO O Fecales > 10 O Totales > 1000
- **AMARILLO**: Totales > 100 (pero < 1000)
- **VERDE**: Todo dentro de límites

### Pesticidas

- **ROJO**: NO CUMPLE
- **VERDE**: CUMPLE

## 🔧 Ajustar Límites

Edita el objeto `LIMITES` en `app.js`:

```javascript
const LIMITES = {
    fecales_max: 10,           // Cambiar según normativa
    totales_advertencia: 100,  // Cambiar según normativa
    totales_max: 1000          // Cambiar según normativa
};
```

## 📝 Uso del Sistema

1. Ingresa el código del proveedor (ej: `P001`)
2. Click en **Validar**
3. Revisa el historial de análisis previos
4. Llena el formulario de nuevo análisis
5. Los semáforos se calculan automáticamente
6. Click en **Guardar Análisis**

## 🛠️ Mantenimiento

### Agregar nuevos proveedores

1. Ve a Firestore Console
2. Collection `proveedores` → **Add document**
3. Document ID: código del proveedor
4. Agrega los campos: `nombre`, `numeroSerie`, `activo`

### Ver registros en Firebase

1. Firestore Console → Collection `registros`
2. Puedes filtrar por `cve_prov` para ver análisis de un proveedor específico

## ⚠️ Notas Importantes

- Este sistema NO tiene autenticación (uso interno)
- Las reglas de Firestore permiten lectura/escritura total
- Solo usar en redes internas o privadas
- Para producción con acceso público, implementar autenticación

## 🐛 Troubleshooting

### "Firebase is not defined"
- Verifica que `config.js` esté cargado antes que `app.js` en `index.html`

### "Collection not found"
- Verifica que las colecciones `proveedores` y `registros` existan en Firestore

### "Permission denied"
- Verifica las reglas de Firestore (deben permitir read/write)

### Los semáforos no se muestran
- Abre la consola del navegador (F12) y busca errores
- Verifica que los datos en Firestore tengan la estructura correcta

## 📞 Soporte

Si encuentras problemas, revisa:
1. Consola del navegador (F12)
2. Reglas de Firestore
3. Estructura de datos en Firestore
4. Credenciales en `config.js`
