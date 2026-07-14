Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

� **INFORME OFICIAL QA — V1.1 REV. COMPLETA Informe de Pruebas Finca Jirah** 

Sistema de Gestión Agrícola PWA Offline-First 

Cobertura completa de todos los casos de uso implementados CU-01 _·_ CU-03 _·_ CU-04 _·_ CU-05 _·_ CU-05.3 _·_ CU-06 

**SISTEMA FECHA EQUIPO FRAMEWORK** Finca Jirah v0.1.0 13 Julio 2026 QA – ESPE Vitest v4.1.10 **CLASIFICACION COBERTURA CASOS RESULTADO** Confidencial 85.8 % Líneas 125 / 125 � 100 % PASS 

Universidad de las Fuerzas Armadas ESPE _•_ Análisis de Sistemas 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

# **Tabla de Contenidos** 

|**0**|||
|---|---|---|
|**1. **|**Resumen Ejecutivo**|**3**|
|**2. **|**Alcance y Objetivos**|**4**|
||2.1. Módulos bajo prueba — Cobertura completa . . . . . . . .|. . . . . . . .<br>4|
||2.2. Tipos de prueba implementados . . . . . . . . . . . . . . .|. . . . . . . .<br>5|
||2.3. Fuera de alcance (explícito) . . . . . . . . . . . . . . . . .|. . . . . . . .<br>5|
|**3. **|**Entorno y Herramientas**|**6**|
||3.1. Archivos de prueba — 10 suites . . . . . . . . . . . . . . .|. . . . . . . .<br>7|
|**4. **|**Resultados de la Ejecución**|**8**|
||4.1. Salida de consola — Vitest<br>. . . . . . . . . . . . . . . . .|. . . . . . . .<br>8|
||4.2. Casos de prueba por módulo . . . . . . . . . . . . . . . . .|. . . . . . . .<br>8|
||4.3. Cobertura de código por módulo<br>. . . . . . . . . . . . . .|. . . . . . . .<br>11|
|**5. **|**Análisis de Defectos**|**12**|
|**6. **|**Valoración del Cumplimiento**|**13**|
||6.1. Semáforo de calidad . . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>13|
|**7. **|**Conclusiones y Recomendaciones**|**14**|
||7.1. Conclusiones . . . . . . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>14|
||7.2. Recomendaciones categorizadas . . . . . . . . . . . . . . .|. . . . . . . .<br>14|
||7.3. Evidencias de ejecución<br>. . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>15|



2 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

# **<mark>1</mark> Resumen Ejecutivo** 

## **1.0 Visión general** 

Este informe documenta la ejecución **completa** del Plan de Pruebas de Calidad (QA) para el sistema **Finca Jirah** . La revisión v1.1 incorpora las suites faltantes para CU-04, CU-05.3 y CU-06, logrando cobertura total de todos los casos de uso implementados en el sistema. 



<!-- Start of picture text -->
125 125 0 100 %<br>Casos Ejecutados Casos Pasados Casos Fallidos Tasa de Éxito<br>85.8 % 75.3 % 10 1.74s<br>Cobertura Líneas Cobertura Ramas Archivos de Prueba Tiempo Total<br><!-- End of picture text -->

� **Revisión Completa v1.1:** Se añadieron 43 casos de prueba (CU-04: 24, CU-05.3: 8, CU-06: 11) para cubrir **todos** los casos de uso implementados. Total: 125 casos en 10 suites, 100 % exitosos. 

� **Nota metodológica:** Cada Caso de Uso (CU) se descompone en Casos de Prueba atómicos (TC) que verifican un único escenario con mocks de dependencias. La organización CU _→_ TC constituye la Matriz de Trazabilidad requerida por el Plan QA, combinando _pruebas unitarias puras_ (funciones de dominio) con _pruebas unitarias de servicio_ (lógica de negocio con repositorios mockeados). 

3 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

# **<mark>2</mark> Alcance y Objetivos** 

## **2.1 Módulos bajo prueba — Cobertura completa** 

|**ID**|**Módulo / Clases Probadas**|**Casos**|**Estado**|
|---|---|---|---|
|`CU-01`|**Acceso al Sistema** —<br>`AuthService` : Login,<br>Recuperación, Blacklist, Fortaleza|13|✓**Cubierto**|
|`CU-03`|**Gestión**<br>**de**<br>**Agricultores**<br>—<br>`AgricultorService`:<br>CRUD,<br>Cédula<br>EC<br>(módulo-10), desactivación|14|✓**Cubierto**|
|`CU-04`|**Catálogos de Finca** —<br>`CampanaService`,<br>`LoteService` ,<br>`CompradorService`: códigos<br>únicos, tara bloqueada, lote en uso|24|✓**Cubierto**|
|`CU-05`|**Transacciones**<br>**(Core)**<br>—<br>`PesajeService`,<br>`ClasificacionService`,|33|✓**Cubierto**|
||`CalculadoraCosecha`<br>(Strategy),<br>`OfflinePayloadAdapter` (Adapter)|||
|`CU-05.3`|**Ajuste de Comprador**—<br>`AjusteService`:pe-<br>so rechazado, fruta efectiva, validaciones E.1–<br>E.3|8|✓**Cubierto**|
|`CU-06`|**Dashboard / Analítica** —<br>`DashboardRepo`:<br>kgTotal, alertas, kgPorLote, fltros por fe-<br>cha/campaña|11|✓**Cubierto**|
|`Patrones`|**Arquitectura** —<br>`SyncStateContext` (State),<br>`NetworkSyncSubject` (Observer)|22|✓**Cubierto**|
|**Total**||**125**|✓**Cubierto**|



4 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

## **2.2 Tipos de prueba implementados** 

|**Tipo**|**Descripción y ejemplos**|**Módulos**|
|---|---|---|
|**Unitaria pura**|Función<br>aislada<br>sin<br>dependencias:<br>`validarCedulaEC()`,<br>`calcularMargen()`,<br>`SyncStateContext.startSync()`|Calculo, State,<br>Observer,<br>Adapter|
|**Unitaria de servi-**<br>**cio**|Método<br>de<br>servicio<br>con<br>repositorios<br>mockeados:<br>`CampanaService.crear()`,<br>`AjusteService.registrar()`|AuthService,<br>AgricultorServi-<br>ce,<br>PesajeService,<br>CampanaServi-<br>ce,<br>AjusteService|
|**Prueba de repo-**<br>**sitorio**|Repositorio con Prisma mockeado para verifcar<br>queries: fltros, agrupaciones, distinct|DashboardRepo|
|**Prueba**<br>**de**<br>**pa-**<br>**trón**|Comportamiento dinámico de patrones de diseño<br>(Strategy, State, Observer, Adapter)|CalculadoraCosecha,<br>SyncState|



## **2.3 Fuera de alcance (explícito)** 

- _⊘_ Componentes UI de React y hooks de presentación visual 

- _⊘_ Pruebas E2E (End-to-End) en navegador real (Playwright/Cypress) 

- _⊘_ Conexiones a instancias reales de BD (SQLite / PostgreSQL) 

- _⊘_ <mark>`offline.service.ts`</mark> — Hook de dispositivo (sin lógica de negocio aislable) 

- _⊘_ Servicio de email y notificaciones externas en producción 

5 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

# **<mark>3</mark> Entorno y Herramientas** 

|**Componente**|**Descripción**|**Estado**|
|---|---|---|
|**Vitest v4.1.10**|Framework<br>de<br>pruebas<br>compatible<br>con<br>Vi-<br>te/Next.js. API compatible con Jest. Modo:<br>`vitest run`.|✓**Cubierto**|
|**@vitest/coverage-**<br>**v8**|Cobertura con proveedor v8 (Istanbul). Reportes:<br>text, json. Umbrales: Líneas_≥_85 %, Ramas_≥_70 %,<br>Funciones _≥_70 %.|✓**Cubierto**|
|**vi.mock()**|Mocking<br>manual<br>de<br>`CampanaRepo` ,|✓**Cubierto**|
||`LoteRepo`,<br>`CompradorRepo`,<br>`AjusteRepo`,||
||`UserRepository`,<br>`PesajeRepository`<br>y<br>`PrismaClient`.||
|**Stack tecnológico**|Next.js 16.2.9, TypeScript 5, Prisma 7.8.0, React<br>19.2.4, bcryptjs 3.0.3|Producción|
|**SO**|Windows 11 — MiKTeX 26.2 (compilación LaTeX)|Activo|



6 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

## **— 3.1 Archivos de prueba 10 suites** 

|**Archivo**|**Módulo cubierto**|**Tests**|
|---|---|---|
|`auth.service.test.ts`|AuthService — Login, Recuperación, Blac-<br>klist, Fortaleza|13|
|`agricultor.service.test.ts`|AgricultorService — CRUD, Cédula EC,<br>Desactivación|14|
|`catalogo.service.test.ts`|CampanaService + LoteService + Com-<br>pradorService (CU-04)|24|
|`pesaje.service.test.ts`|PesajeService + ClasifcacionService (CU-<br>05)|9|
|`ajuste.service.test.ts`|AjusteService — Peso rechazado, Fruta<br>efectiva (CU-05.3)|8|
|`calculadora.test.ts`|CalculadoraCosecha — Strategy, cambio<br>dinámico|17|
|`offline.adapter.test.ts`|OfinePayloadAdapter — Patrón Adapter|7|
|`sync.state.test.ts`|SyncStateContext — Patrón State, transi-<br>ciones|16|
|`sync.observer.test.ts`|NetworkSyncSubject — Patrón Observer|6|
|`dashboard.test.ts`|DashboardRepo — getStats(), fltros, kg-<br>PorLote (CU-06)|11|
|**Total**||**125**|



7 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

# **<mark>4</mark> Resultados de la Ejecución** 

## **4.1 Salida de consola — Vitest** 



<!-- Start of picture text -->
RUN v4.1.10 C:/. . . /FincaJIRAH/<br>Coverage enabled with v8<br>v __tests__/sync.observer.test.ts (6 tests) 15ms<br>v __tests__/agricultor.service.test.ts (14 tests) 19ms<br>v __tests__/calculadora.test.ts (17 tests) 13ms<br>v __tests__/sync.state.test.ts (16 tests) 13ms<br>v __tests__/offline.adapter.test.ts (7 tests) 9ms<br>v __tests__/pesaje.service.test.ts (9 tests) 16ms<br>v __tests__/ajuste.service.test.ts (8 tests) 16ms<br>v __tests__/dashboard.test.ts (11 tests) 41ms<br>v __tests__/catalogo.service.test.ts (24 tests) 31ms<br>v __tests__/auth.service.test.ts (13 tests) 733ms<br>Test Files 10 passed (10)<br>Tests 125 passed (125)<br>Start at 22:47:51<br>Duration 1.74s<br><!-- End of picture text -->

## **4.2 Casos de prueba por módulo** 

|**ID Caso**|**Suite**|**Nombre del Caso**|**Resultado Espe-**<br>**rado**|**Est.**|
|---|---|---|---|---|
|`TC-01.1.1`|AuthService|Login — Flujo Normal|Sin<br>pass-<br>wordHash|✓**PASS**|
|`TC-01.1.2`|AuthService|Login — Contraseña incorrecta|Retorna null|✓**PASS**|
|`TC-01.1.3`|AuthService|Login — Usuario inexistente|Retorna null|✓**PASS**|
|`TC-01.1.4`|AuthService|Login — Cuenta inactiva|ACCOUNT_INACTI|VE<br>✓**PASS**|
|`TC-01.2.1`|AuthService|Recuperación — Flujo Normal|Token generado|✓**PASS**|
|`TC-01.2.2`|AuthService|Recuperación — Email inexistente|Retorna null|✓**PASS**|
|`TC-01.2.3`|AuthService|Recuperación — Token expirado|TOKEN_EXPIRAD|O<br>✓**PASS**|
|`TC-01.PF1–4`|AuthService|validarFortaleza (4 variantes)|ok=false/true|✓**PASS**|
|`TC-01.BL1–2`|AuthService|Blacklist: revocar + verifcar|false/true|✓**PASS**|
|`TC-03.1.1`|AgricultorService|Crear — Flujo Normal|user+_dev_passwor|d<br>✓**PASS**|
|`TC-03.1.2`|AgricultorService|Crear — Cédula duplicada|CEDULA_EN_USO|✓**PASS**|
|`TC-03.1.X`|AgricultorService|Crear — Cédula inválida|CEDULA_INVALID|A<br>✓**PASS**|
|`TC-03.1.Y`|AgricultorService|Crear — Email duplicado|EMAIL_EN_USO|✓**PASS**|
|`TC-03.2.1`|AgricultorService|Buscar por término|Lista<br>coinciden-<br>cias|✓**PASS**|
|`TC-03.3.1`|AgricultorService|Editar — Flujo Normal|Agricultor actua-<br>lizado|✓**PASS**|
|`TC-03.3.2`|AgricultorService|Editar — Email duplicado|EMAIL_EN_USO|✓**PASS**|



8 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

|**ID Caso**|**Suite**|**Nombre del Caso**|**Resultado Espe-**<br>**rado**|**Est.**|
|---|---|---|---|---|
|`TC-03.4.1`|AgricultorService|Desactivar — Flujo Normal|isActive=false|✓**PASS**|
|`TC-03.4.2`|AgricultorService|Desactivar — Auto-desactivación|SELF_DEACTIVATI|ON<br>✓**PASS**|
|`TC-03.CE1–5`|AgricultorService|Cédula EC (módulo-10, 5 varian-<br>tes)|true/false|✓**PASS**|
|`TC-04.1.1`|CampanaService|Crear — Flujo Normal + tara 1.70|codigo=uppercase|✓**PASS**|
|`TC-04.1.2`|CampanaService|Crear — Código duplicado|CODIGO_DUPLICA|DO<br>✓**PASS**|
|`TC-04.1.3`|CampanaService|Crear — Código vacío|CODIGO_REQUERI|DO<br>✓**PASS**|
|`TC-04.1.4`|CampanaService|Crear — Tara >10|TARA_INVALIDA|✓**PASS**|
|`TC-04.1.5`|CampanaService|Crear — Tara _≤_0|TARA_INVALIDA|✓**PASS**|
|`TC-04.2.1`|CampanaService|Actualizar nombre|nombre actualiza-<br>do|✓**PASS**|
|`TC-04.2.2`|CampanaService|Actualizar — Campaña inactiva|CAMPANA_INACTI|VA<br>✓**PASS**|
|`TC-04.2.3`|CampanaService|Actualizar — Tara bloqueada (pe-<br>sajes)|TARA_BLOQUEAD|A<br>✓**PASS**|
|`TC-04.2.4`|CampanaService|Actualizar — Tara sin pesajes|OK|✓**PASS**|
|`TC-04.3.1`|CampanaService|Cerrar — Sin pendientes|isActive=false|✓**PASS**|
|`TC-04.3.2`|CampanaService|Cerrar — Con PENDING sync|SYNC_PENDIENTE|✓**PASS**|
|`TC-04.3.3`|CampanaService|Cerrar — Ya cerrada|CAMPANA_YA_CE|RRADA<br>✓**PASS**|
|`TC-04.L1`|LoteService|Crear lote — Flujo Normal|codigo=uppercase|✓**PASS**|
|`TC-04.L2`|LoteService|Crear — Código duplicado|CODIGO_DUPLICA|DO<br>✓**PASS**|
|`TC-04.L3`|LoteService|Crear — Nombre vacío|NOMBRE_REQUER|IDO<br>✓**PASS**|
|`TC-04.L4`|LoteService|Eliminar — Sin campaña activa|isActive=false|✓**PASS**|
|`TC-04.L5`|LoteService|Eliminar — Con pesajes en campa-<br>ña|LOTE_EN_USO|✓**PASS**|
|`TC-04.C1`|CompradorService|Crear con RUC único|tolerancia=4.0|✓**PASS**|
|`TC-04.C2`|CompradorService|Crear — RUC duplicado|RUC_DUPLICADO|✓**PASS**|
|`TC-04.C3`|CompradorService|Crear — Nombre vacío|NOMBRE_REQUER|IDO<br>✓**PASS**|
|`TC-04.C4`|CompradorService|Crear — Tolerancia >100|TOLERANCIA_INV|ALIDA<br>✓**PASS**|
|`TC-04.C5`|CompradorService|Crear sin RUC (opcional)|OK|✓**PASS**|
|`TC-04.C6`|CompradorService|Actualizar nombre|nombre actualiza-<br>do|✓**PASS**|
|`TC-04.C7`|CompradorService|Actualizar — No encontrado|COMPRADOR_NO|_ENCONTRADO<br>✓**PASS**|
|`TC-05.1.1`|PesajeService|Registrar pesaje — Flujo Normal|pesoNeto correc-<br>to|✓**PASS**|
|`TC-05.1.X`|PesajeService|pesoBrutoKg=0|PESO_BRUTO_INV|ALIDO<br>✓**PASS**|
|`TC-05.1.Y`|PesajeService|Campaña inactiva|CAMPANA_CERRA|DA<br>✓**PASS**|
|`TC-05.2.1`|ClasifcacionService|Clasifcar dentro del margen|dentroDelMargen=tr|ue<br>✓**PASS**|
|`TC-05.2.2`|ClasifcacionService|Descuadre >±4 %|DESCUADRE:X %|✓**PASS**|
|`TC-05.2.3`|ClasifcacionService|forzar=true con descuadre|auditFlag=true|✓**PASS**|
|`TC-05.2.X`|ClasifcacionService|Ya clasifcado|YA_CLASIFICADO|✓**PASS**|
|`TC-05.3.1`|AjusteService|Registrar ajuste — Flujo Normal|pctFrutaEfectiva>90|✓**PASS**|
|`TC-05.3.2`|AjusteService|pesoRechazado=0|pctFrutaEfectiva_≈_10|0<br>✓**PASS**|



9 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

|**ID Caso**|**Suite**|**Nombre del Caso**|**Resultado Espe-**<br>**rado**|**Est.**|
|---|---|---|---|---|
|`TC-05.3.3`|AjusteService|Clasifcación no encontrada|CLASIF_NO_ENCO|NTRADA<br>✓**PASS**|
|`TC-05.3.4`|AjusteService|Ajuste duplicado|AJUSTE_YA_REGI|STRADO<br>✓**PASS**|
|`TC-05.3.5`|AjusteService|Rechazo excede exportación|RECHAZO_EXCED|E<br>✓**PASS**|
|`TC-05.3.6`|AjusteService|Comprador no existe|COMPRADOR_NO|_ENCONTRADO<br>✓**PASS**|
|`TC-05.3.7`|AjusteService|pesoRechazado negativo|PESO_RECHAZAD|O_INVALIDO<br>✓**PASS**|
|`TC-05.3.8`|AjusteService|ajusteKg = 3 decimales exactos|45.267|✓**PASS**|
|`TC-ST.N1–4`|CalculadoraCosecha|Margen 0 %, 4 %, >4 %, bruto=0|OK|✓**PASS**|
|`TC-ST.E1–2`|CalculadoraCosecha|Exportación 2 % y 2.5 %|2/false|✓**PASS**|
|`TC-ST.T1–2`|CalculadoraCosecha|Tara estándar y personalizada|8.50/6.0 kg|✓**PASS**|
|`TC-ST.C1–3`|CalculadoraCosecha|calcularPesaje + validarClasif.|tara=3.40|✓**PASS**|
|`TC-ST.DM`|CalculadoraCosecha|setEstrategiaMargen() dinámico|margenPermitido=2|✓**PASS**|
|`TC-ST.DT`|CalculadoraCosecha|setEstrategiaTara() dinámico|tara=4.0 kg|✓**PASS**|
|`TC-AD.1–7`|OfineAdapter|adaptPesaje + adaptClasifcacion<br>(7 variantes)|syncStatus=SYNCE|D<br>✓**PASS**|
|`TC-SS.1–16`|SyncStateContext|PENDING/SYNCING/SYNCED +<br>transiciones (16 variantes)|OK|✓**PASS**|
|`TC-OB.1–6`|SyncObserver|subscribe, notify, unsubscribe, múl-<br>tiples (6 variantes)|OK|✓**PASS**|
|`TC-06.1`|DashboardRepo|kgTotal y totalPesajes desde agre-<br>gación|1250.50 kg / 28|✓**PASS**|
|`TC-06.2`|DashboardRepo|campanaActiva en resultado|CA-2026|✓**PASS**|
|`TC-06.3`|DashboardRepo|Lotes con actividad (distinct)|2 lotes|✓**PASS**|
|`TC-06.4`|DashboardRepo|Alertas<br>de<br>margen<br>(audit-<br>Flag=true)|3 alertas|✓**PASS**|
|`TC-06.5`|DashboardRepo|kgPorLote — acumulación KG|LT-01=98.5 kg|✓**PASS**|
|`TC-06.6`|DashboardRepo|kgPorLote — alertas por lote|LT-02=1 alerta|✓**PASS**|
|`TC-06.7`|DashboardRepo|Sin campaña activa|campanaActiva=null|✓**PASS**|
|`TC-06.8`|DashboardRepo|Filtros por fechaDesde/fechaHasta|where.fechaRegistro|✓**PASS**|
|`TC-06.9`|DashboardRepo|Filtro por campanaId|where.campanaId|✓**PASS**|
|`TC-06.10`|DashboardRepo|getCampanas() — selector|2 campañas|✓**PASS**|
|`TC-06.11`|DashboardRepo|getLotes() — solo activos|isActive=true|✓**PASS**|
||||**Total**|**125**|



10 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

## **4.3 Cobertura de código por módulo** 

|**Módulo**|**Stmts**|**Branch**|**Funcs**|**Lines**|
|---|---|---|---|---|
|`SyncObserver.ts`|100 %|100 %|100 %|**100 %**|
|`OfflinePayloadAdapter.ts`|100 %|50 %|100 %|**100 %**|
|`DashboardRepository.ts`|96.6 %|81.0 %|100 %|**100 %**|
|`SyncState.ts`|96.6 %|100 %|95.5 %|**96.6 %**|
|`ICalculoMargen.ts`|88.9 %|85.7 %|87.5 %|**92.0 %**|
|`agricultor.service.ts`|89.1 %|87.5 %|71.4 %|**87.8 %**|
|`pesaje.service.ts`|75.0 %|69.7 %|33.3 %|**83.8 %**|
|`catalogo.service.ts`|75.6 %|72.7 %|53.8 %|**77.8 %**|
|`ajuste.service.ts`|77.3 %|78.6 %|33.3 %|**76.5 %**|
|`auth.service.ts`|73.2 %|67.9 %|40.0 %|**79.3 %**|
|**Total Alcance QA**|**82.1 %**|**75.3 %**|**71.7 %**|**85.8 %**|





<!-- Start of picture text -->
SyncObserver 100 %<br>OfflineAdapter 100 %<br>DashboardRepo 100 %<br>SyncState 96.6 %<br>ICalculoMargen 92.0 %<br>agricultor.service 87.8 %<br>pesaje.service 83.8 %<br>catalogo.service 77.8 %<br>ajuste.service 76.5 %<br>auth.service 79.3 %<br>0 % 20 % 40 % 60 % 80 % 100 %<br>umbral<br>85 %<br><!-- End of picture text -->

La línea discontinua representa el umbral mínimo del 85 % de cobertura de líneas. Cobertura global: **85.8 %** . 

11 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

# **<mark>5</mark> Análisis de Defectos** 

� **Sin defectos críticos:** Los 125 casos de prueba finales ejecutan exitosamente (0 fallos). Se corrigió 1 defecto en datos de prueba durante el desarrollo, antes de la ejecución definitiva. 

### **<mark>Moderada</mark> DEF-001 — Cédula ecuatoriana con dígito verificador incorrecto (dato de prueba)** 

Se utilizó <mark>`1723456789`</mark> como dato válido. El algoritmo módulo-10 rechazó la cédula correctamente; el error era en el dato de prueba (dígito esperado: **4** , no **9** ). Corregido con cédula real válida <mark>`1714397104`</mark> . 

**Impacto:** Ninguno sobre el sistema. **Estado:** <mark>✓</mark> **<mark>Cubierto</mark>** Corregido. 

**<mark>Sugerida</mark> OBS-001 — AuthService: Cobertura de funciones al 40 %** 

Las funciones <mark>`resetearPassword()`</mark> y <mark>`hashPassword()`</mark> acceden directamente a <mark>`bcrypt`</mark> y <mark>`PrismaClient` .</mark> Las pruebas unitarias no pueden mockearlas sin romper el encapsulamiento. Requieren pruebas de integración con SQLite en memoria. 

**Estado:** � **Pendiente** Backlog — Sprint 2. Impacto estimado: elevar AuthService del 79.3 % al 95 %+. 

**<mark>Sugerida</mark> OBS-002 — AjusteService y CatalogoService: Cobertura <85 % en líneas** <mark>`CampanaService.cerrar()`</mark> importa <mark>`prisma`</mark> dinámicamente <mark>(</mark> <mark>`import(’@/lib/prisma’)` )</mark> ; el mock estático de <mark>`vi.mock()`</mark> no intercepta importaciones dinámicas. <mark>`AjusteService.registrar()`</mark> usa <mark>`prisma.clasificacion.findUnique`</mark> directamente. Estas rutas quedan fuera del alcance del mock estático y reducen la cobertura. **Estado:** � **Pendiente** Sprint 2 — Prioridad media. Resolver con mock de módulo dinámico o refactorización a repositorio. 

12 

<mark>[J</mark> 



\v) \v) \v) 



\v) \v) 



\v) 



Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

# **<mark>7</mark> Conclusiones y Recomendaciones** 

## **7.1 Conclusiones** 

- El sistema Finca Jirah completa el **100 % de cobertura funcional** en todos los casos de uso implementados: CU-01, CU-03, CU-04, CU-05, CU-05.3 y CU-06. Los 125 casos ejecutados validaron la solidez de la arquitectura de tres capas. 

- Los **cuatro patrones de diseño** (Strategy, State, Observer, Adapter) están correctamente encapsulados e intercambiables en runtime, confirmado por pruebas de mutabilidad dinámica. 

- La **lógica de negocio CU-04** (Catálogos) impone correctamente las restricciones de código único, tara bloqueada si hay pesajes, lote en uso y sincronización pendiente al cerrar campaña. 

   - y el porcentaje de fruta efectiva con precisión de 3 decimales. 

- Las **queries de Dashboard (CU-06)** agregan, agrupan y filtran datos correctamente, incluyendo la detección de lotes con actividad, alertas de margen y totales acumulados. 

- La **cobertura de funciones** en <mark>`AuthService`</mark> (40 %) y <mark>`AjusteService`</mark> (33 %) es baja porque acceden a Prisma directamente sin repositorio abstracto, impidiendo el mocking unitario de esas rutas. 

## **7.2 Recomendaciones categorizadas** 

**<mark>Crítica</mark> REC-01 — Pruebas de integración para AuthService y AjusteService** 

Implementar pruebas de integración con LibSQL <mark>`:memory:`</mark> para cubrir <mark>`resetearPassword()`</mark> , <mark>`hashPassword()`</mark> y las rutas de <mark>`AjusteService.registrar()`</mark> que usan <mark>`prisma.clasificacion.findUnique`</mark> directamente. **Sprint:** 2 — Prioridad Alta. 

**<mark>Moderada</mark> REC-02 — Refactorizar importaciones dinámicas de Prisma en CatalogoService** <mark>`CampanaService.cerrar()`</mark> y <mark>`LoteService.eliminar()`</mark> usan <mark>`import(’@/lib/prisma’)`</mark> dinámico. Extraer esas queries a métodos del repositorio <mark>(</mark> <mark>`CampanaRepo.countPendientes()` ,</mark> <mark>`LoteRepo.countPesajesActivos()` )</mark> para que sean interceptables por mocks estáticos. **Sprint:** 2 — Prioridad Media. 

14 

Confidencial Interno 

Finca Jirah — Informe QA v1.1 (Rev. Completa) 

### **<mark>Sugerida</mark> REC-03 — Pruebas E2E con Playwright en entorno de staging** 

Como tercera capa de validación, implementar pruebas E2E para los flujos CU-01 (login), CU-03 (crear agricultor), CU-05 (registrar pesaje) y CU-05.3 (ajuste de comprador) con base de datos SQLite de prueba. 

**Sprint:** 3 — Prioridad Baja. 

� **Veredicto de Calidad:** El sistema Finca Jirah cumple el 100 % de cobertura funcional de sus casos de uso implementados. Con 125/125 casos exitosos y cobertura de líneas del 85.8 %, está en condiciones de avanzar a la fase de staging. Se recomienda integrar esta suite en CI/CD para prevenir regresiones en cada commit. 

## **7.3 Evidencias de ejecución** 

— <mark>`coverage/coverage-summary.json`</mark> Reporte JSON de cobertura v8 

<mark>`__tests__/auth.service.test.ts`</mark> — 13 casos (CU-01) 

<mark>`__tests__/agricultor.service.test.ts`</mark> — 14 casos (CU-03) 

<mark>`__tests__/catalogo.service.test.ts`</mark> — 24 casos (CU-04) **[nuevo]** 

<mark>`__tests__/pesaje.service.test.ts`</mark> — 9 casos (CU-05) 

<mark>`__tests__/ajuste.service.test.ts`</mark> — 8 casos (CU-05.3) **[nuevo]** 

— <mark>`__tests__/calculadora.test.ts`</mark> 17 casos (Strategy) 

— <mark>`__tests__/offline.adapter.test.ts`</mark> 7 casos (Adapter) 

<mark>`__tests__/sync.state.test.ts`</mark> — 16 casos (State) 

<mark>`__tests__/sync.observer.test.ts`</mark> — 6 casos (Observer) 

<mark>`__tests__/dashboard.test.ts`</mark> — 11 casos (CU-06) **[nuevo]** 

Finca Jirah — Sistema de Gestión Agrícola PWA _•_ Informe QA v1.1 Revisión Completa _•_ 13 de Julio de 2026 

Universidad de las Fuerzas Armadas ESPE — Análisis de Sistemas _•_ Confidencial Interno 

15 

