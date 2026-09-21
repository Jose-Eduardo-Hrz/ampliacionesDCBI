# Solicitud de ampliación de cupo — UAM Azcapotzalco

Sistema web para que los alumnos de la Unidad Azcapotzalco soliciten la
ampliación de cupo en una o varias Unidades de Enseñanza Aprendizaje (UEA),
y para que el área administrativa revise esas solicitudes, consulte los
datos de los alumnos y descargue la credencial y la solicitud en PDF de
cada uno.

Construido con SvelteKit, TypeScript, Prisma y SQLite.

## Requisitos

- **Node.js** 20.6 o superior (usa `--env-file`, ver la sección de
  [Producción](#producción) más abajo). Probado con Node 24.
- **pnpm** 9 o superior. Probado con pnpm 11.

## Instalación

```sh
pnpm install
```

Después de instalar, copia el archivo de variables de entorno de ejemplo y
ajústalo (ver la sección siguiente):

```sh
cp .env.example .env
```

## Variables de entorno

Todas viven en `.env` (nunca se sube a control de versiones). `.env.example`
documenta cada una con su formato esperado.

| Variable          | Obligatoria        | Descripción                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Sí                 | Ruta de la base de datos SQLite, p. ej. `file:./prisma/dev.db`.                                                                                                                                                                                                                                                                               |
| `MAX_PDF_SIZE_MB` | Sí                 | Tamaño máximo permitido por archivo PDF subido (credencial o solicitud), en megabytes. Es la única fuente de verdad de este límite: se usa igual en la validación del cliente y del servidor.                                                                                                                                                 |
| `SESSION_SECRET`  | Sí                 | Clave para firmar las cookies de sesión del administrador y del proceso de registro del alumno. Debe medir al menos 32 caracteres; **la aplicación se niega a arrancar** si falta o es demasiado corta — nunca tiene un valor por defecto. Genera una propia con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `ORIGIN`          | Solo en producción | Necesaria únicamente al correr el build (`node build/index.js`): le indica a la protección CSRF de SvelteKit cuál es el origen real del sitio (p. ej. `https://ampliacion.azc.uam.mx`). `pnpm run dev` no la necesita, la infiere sola. Sin ella, los formularios (login, registro) responden 403 en producción.                              |
| `BODY_SIZE_LIMIT` | Solo en producción | `@sveltejs/adapter-node` rechaza peticiones mayores a este tamaño **antes** de que la aplicación las vea; por defecto son solo `512K`, insuficiente para subir 2 PDF. Debe ser mayor a `2 * MAX_PDF_SIZE_MB` más margen (ver el valor de ejemplo en `.env.example`). Si cambias `MAX_PDF_SIZE_MB`, ajusta también este valor.                 |

## Base de datos

El esquema vive en `prisma/schema.prisma` (SQLite). Para crear o actualizar
la base de datos de desarrollo aplicando las migraciones:

```sh
pnpm run db:migrate
```

Si cambias el esquema, genera de nuevo el cliente de Prisma (normalmente
`db:migrate` ya lo hace, pero por si acaso quedó desactualizado):

```sh
pnpm run db:generate
```

> `prisma studio` no es compatible con este proyecto: Prisma Studio no
> soporta bases de datos SQLite conectadas mediante un driver adapter
> personalizado (`@prisma/adapter-better-sqlite3`), que es como este
> proyecto se conecta a la base de datos. Para explorar los datos
> manualmente, usa cualquier visor de SQLite (por ejemplo, la extensión
> "SQLite Viewer" de VS Code) apuntando a `prisma/dev.db`.

## Seed (datos de prueba)

```sh
pnpm run db:seed
```

Carga un administrador y varios alumnos/UEA/horarios/ampliaciones de
ejemplo (ver `prisma/seed.ts`). Es seguro volver a ejecutarlo: usa `upsert`,
así que no duplica datos ni reinicia los que ya existan (por ejemplo, no le
resetea la contraseña a un administrador que ya la haya cambiado).

⚠️ **Nunca ejecutes `pnpm run db:seed` contra una base de datos de
producción.** Si lo haces sobre una base de datos nueva (sin ningún
administrador todavía), crea la cuenta de prueba documentada abajo con una
contraseña pública y conocida (está en este mismo repositorio). Ver
[Usuarios de prueba](#usuarios-de-prueba).

## Desarrollo

```sh
pnpm run dev
```

Abre `http://localhost:5173`. Otros comandos útiles durante el desarrollo:

```sh
pnpm run check   # TypeScript + Svelte
pnpm run lint    # Prettier + ESLint
pnpm run format  # aplica el formato de Prettier
pnpm run test    # suite de pruebas automatizadas (Vitest)
```

`pnpm run test` usa su **propia base de datos** (`prisma/test.db`,
configurada en `.env.test`), separada de `prisma/dev.db`: nunca toca tus
datos de desarrollo. Antes de correr las pruebas, un script `pretest`
la reconstruye desde cero (migra + siembra) automáticamente.

## Build

```sh
pnpm run build
```

Genera el servidor de producción en `build/` (adapter-node). Para
levantarlo:

```sh
node build/index.js
```

### Producción

`node build/index.js` **no** carga `.env` automáticamente (a diferencia de
`pnpm run dev`). Debes proveer las variables de entorno de alguna forma,
por ejemplo con la bandera nativa de Node:

```sh
node --env-file=.env build/index.js
```

Además, en producción son obligatorias `ORIGIN` y recomendable
`BODY_SIZE_LIMIT` (ver la tabla de variables de entorno arriba) — sin
`ORIGIN`, el login y el registro fallan con 403.

## Estructura

```text
src/
  lib/
    components/     Componentes de UI reutilizables (botones, inputs, tablas, etc.)
    validation/      Esquemas de validacion (Zod) compartidos entre cliente y servidor
    server/          Codigo exclusivo del servidor: acceso a datos (Prisma), autenticacion,
                     manejo de archivos, orquestacion de los flujos de negocio
  routes/            Paginas y endpoints de SvelteKit
prisma/
  schema.prisma      Modelo de datos
  migrations/        Historial de migraciones
  seed.ts            Datos de ejemplo para desarrollo
documentos/          Carpeta donde se guardan las credenciales y solicitudes en PDF
                     de los alumnos (una subcarpeta "MATRICULA_NOMBRE" por alumno).
                     Su contenido nunca se sube a control de versiones (datos personales).
identidad_uam/       Catalogo de identidad grafica institucional de la UAM (logotipos,
                     colores, tipografia, reglas de uso) usado como referencia de diseno
                     para toda la interfaz. No es codigo de la aplicacion.
```

## Usuarios de prueba

Creados por `pnpm run db:seed` (ver `prisma/seed.ts`). **Exclusivos de
desarrollo — nunca uses estas credenciales en producción.**

| Rol           | Usuario    | Contraseña            |
| ------------- | ---------- | --------------------- |
| Administrador | `ADMIN001` | `CambiaEstaClave123!` |

Alumnos de ejemplo (para probar el flujo desde `/`):

| Matrícula    | Nombre               | Estado                        |
| ------------ | -------------------- | ----------------------------- |
| `2181012345` | Ana García López     | En espera (puede registrarse) |
| `2181012348` | Carlos Méndez Ortiz  | En espera (puede registrarse) |
| `2181012346` | Luis Fernández Ruiz  | Ya registrado                 |
| `2181012347` | María Torres Sánchez | Ya registrado                 |
