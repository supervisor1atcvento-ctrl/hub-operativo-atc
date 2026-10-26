import { Citation, KnowledgeDocument, User } from './types.ts';
import { db } from './db.ts';

export interface AkinatorOption {
  label: string;
  value: string;
}

export interface AkinatorQuestion {
  id: string;
  categorySlug: string;
  text: string;
  attributeKey: string;
  options: AkinatorOption[];
}

export interface KnowledgeTarget {
  id: string;
  categorySlug: string;
  title: string;
  documentTitle: string;
  documentFilename: string;
  summary: string;
  fullProcedure: string;
  attributes: Record<string, string>;
  keywords: string[];
}

export interface AkinatorStepResult {
  certainty: number; // 0 to 100
  status: 'QUESTIONING' | 'SOLVED' | 'NOT_FOUND';
  nextQuestion?: AkinatorQuestion;
  solvedTarget?: KnowledgeTarget;
  answerText: string;
  citations: Citation[];
  candidatesCount: number;
}

// =========================================================================
// 1. BASE DE CONOCIMIENTO DETERMINISTA DE OBJETIVOS (TARGETS)
// =========================================================================
export const KNOWLEDGE_TARGETS: KnowledgeTarget[] = [
  // DIAGNÓSTICO
  {
    id: 'diag-e01',
    categorySlug: 'diagnostico',
    title: 'Código E01 - Falla de Alimentación Principal',
    documentTitle: 'Guía de Diagnóstico Técnico de Fallas y Códigos de Error',
    documentFilename: 'guia_diagnostico_errores_tecnicos.txt',
    summary: 'Voltaje fuera de rango (<95 VAC o >135 VAC) o fusible F1 fundido.',
    fullProcedure:
      'PROCEDIMIENTO TÉCNICO OFICIAL PARA ERROR E01:\n' +
      '1. Medir con multímetro calibrado entre Fase y Neutro en el tomacorriente. El rango nominal debe ser 110-127 VAC (+/- 10%).\n' +
      '2. Verificar la tierra física: la diferencia de potencial entre Neutro y Tierra debe ser menor a 1.5 VAC.\n' +
      '3. Si el voltaje de red es óptimo, desconectar la unidad y revisar el fusible de acción rápida F1 (10 Amperes) en la tarjeta de potencia.\n' +
      '4. Reemplazar fusible únicamente por refacción original con la misma capacidad.',
    attributes: {
      has_error_code: 'si',
      error_code_type: 'e01_voltaje',
      component_type: 'alimentacion_electrica',
      hardware_affected: 'fuente_potencia'
    },
    keywords: ['e01', 'voltaje', 'alimentacion', 'fusible', 'f1', 'energia', 'enciende', 'fase', 'neutro']
  },
  {
    id: 'diag-e02',
    categorySlug: 'diagnostico',
    title: 'Código E02 - Sobrecalentamiento del Módulo de Potencia',
    documentTitle: 'Guía de Diagnóstico Técnico de Fallas y Códigos de Error',
    documentFilename: 'guia_diagnostico_errores_tecnicos.txt',
    summary: 'Temperatura superior a 85°C detectada por sensor NTC o ventilador FAN1 detenido.',
    fullProcedure:
      'PROCEDIMIENTO TÉCNICO OFICIAL PARA ERROR E02:\n' +
      '1. Apagar el equipo inmediatamente y esperar su enfriamiento por 15 minutos.\n' +
      '2. Inspeccionar si las ranuras de ventilación y disipador de aluminio presentan obstrucción por polvo o pelusa.\n' +
      '3. Medir la resistencia del sensor NTC desconectado: debe marcar 10k Ohm a 25°C de temperatura ambiente.\n' +
      '4. Comprobar que el ventilador FAN1 gire libremente sin trabas mecánicas y reciba 12 VDC al arranque.',
    attributes: {
      has_error_code: 'si',
      error_code_type: 'e02_temperatura',
      component_type: 'temperatura_ventilacion',
      hardware_affected: 'sensor_ntc_ventilador'
    },
    keywords: ['e02', 'temperatura', 'caliente', 'sobrecalentamiento', 'ventilador', 'fan1', 'ntc', 'enfriamiento']
  },
  {
    id: 'diag-e03',
    categorySlug: 'diagnostico',
    title: 'Código E03 - Falla en Sensor de Posición / Encoder',
    documentTitle: 'Guía de Diagnóstico Técnico de Fallas y Códigos de Error',
    documentFilename: 'guia_diagnostico_errores_tecnicos.txt',
    summary: 'Ausencia de pulsos de retroalimentación en encoder óptico tras 500 ms.',
    fullProcedure:
      'PROCEDIMIENTO TÉCNICO OFICIAL PARA ERROR E03:\n' +
      '1. Inspeccionar el arnés de 4 hilos del encoder óptico buscando falsos contactos o cables degollados.\n' +
      '2. Limpiar cuidadosamente el disco codificador transparente con un hisopo impregnado de alcohol isopropílico.\n' +
      '3. Girar el eje manualmente y verificar que el LED testigo del sensor parpadee indicando lectura de pulsos.\n' +
      '4. Si no emite señal, sustituir el ensamble del encoder.',
    attributes: {
      has_error_code: 'si',
      error_code_type: 'e03_encoder',
      component_type: 'sensor_posicion',
      hardware_affected: 'encoder_disco'
    },
    keywords: ['e03', 'encoder', 'posicion', 'pulsos', 'disco', 'sensor', 'giro']
  },
  {
    id: 'diag-e04',
    categorySlug: 'diagnostico',
    title: 'Código E04 - Sobrecarga de Corriente en Motor',
    documentTitle: 'Guía de Diagnóstico Técnico de Fallas y Códigos de Error',
    documentFilename: 'guia_diagnostico_errores_tecnicos.txt',
    summary: 'Consumo mayor a 8.5 Amperes por más de 3 segundos consecutivos por atasco o baleros.',
    fullProcedure:
      'PROCEDIMIENTO TÉCNICO OFICIAL PARA ERROR E04:\n' +
      '1. Desconectar la unidad y girar manualmente la flecha del motor para detectar amarres mecánicos o baleros dañados.\n' +
      '2. Retirar la banda de transmisión y energizar el motor en vacío; el amperaje debe descender a menos de 1.2A.\n' +
      '3. Si el amperaje en vacío supera 1.2A, el bobinado del estator presenta corto entre espiras y requiere rebobinado o cambio.',
    attributes: {
      has_error_code: 'si',
      error_code_type: 'e04_motor',
      component_type: 'motor_mecanico',
      hardware_affected: 'motor_baleros'
    },
    keywords: ['e04', 'motor', 'corriente', 'amperes', 'atasco', 'banda', 'sobrecarga', 'baleros']
  },
  {
    id: 'diag-e05',
    categorySlug: 'diagnostico',
    title: 'Código E05 - Error de Comunicación UART',
    documentTitle: 'Guía de Diagnóstico Técnico de Fallas y Códigos de Error',
    documentFilename: 'guia_diagnostico_errores_tecnicos.txt',
    summary: 'Pérdida de enlace serial entre tarjeta madre y display frontal.',
    fullProcedure:
      'PROCEDIMIENTO TÉCNICO OFICIAL PARA ERROR E05:\n' +
      '1. Desconectar el equipo y verificar el cable plano flexible (ribbon cable) entre la tarjeta principal y la carátula.\n' +
      '2. Revisar que los pines del conector J2 no presenten sulfatación, doblado o corrosión.\n' +
      '3. Realizar prueba de continuidad hilo por hilo.',
    attributes: {
      has_error_code: 'si',
      error_code_type: 'e05_comunicacion',
      component_type: 'comunicacion_display',
      hardware_affected: 'cable_plano_uart'
    },
    keywords: ['e05', 'comunicacion', 'uart', 'pantalla', 'display', 'panel', 'cable plano', 'ribbon']
  },
  {
    id: 'diag-e08',
    categorySlug: 'diagnostico',
    title: 'Código E08 - Falla Crítica de Memoria EEPROM',
    documentTitle: 'Guía de Diagnóstico Técnico de Fallas y Códigos de Error',
    documentFilename: 'guia_diagnostico_errores_tecnicos.txt',
    summary: 'Checksum de configuración corrupto; requiere reinicio maestro de fábrica.',
    fullProcedure:
      'PROCEDIMIENTO TÉCNICO OFICIAL PARA ERROR E08:\n' +
      '1. Apagar el equipo desde el switch posterior.\n' +
      '2. Mantener presionados simultáneamente los botones "RESET" y "MODO" en la carátula.\n' +
      '3. Encender el equipo sin soltar ambos botones durante 7 segundos continuos hasta escuchar 3 beeps largos.\n' +
      '4. Si el código persiste tras el reinicio maestro, la memoria física EEPROM requiere reprogramación ISP.',
    attributes: {
      has_error_code: 'si',
      error_code_type: 'e08_eeprom',
      component_type: 'memoria_firmware',
      hardware_affected: 'eeprom_micro'
    },
    keywords: ['e08', 'eeprom', 'memoria', 'checksum', 'reinicio', 'reset', 'modo', 'fabrica', 'firmware']
  },
  {
    id: 'diag-seguridad',
    categorySlug: 'diagnostico',
    title: 'Protocolo Obligatorio de Seguridad Eléctrica en Mantenimiento',
    documentTitle: 'Guía de Diagnóstico Técnico de Fallas y Códigos de Error',
    documentFilename: 'guia_diagnostico_errores_tecnicos.txt',
    summary: 'Desconexión física obligatoria y espera de 3 minutos para descarga capacitiva.',
    fullProcedure:
      'MEDIDAS DE SEGURIDAD ELÉCTRICA:\n' +
      '1. Desconectar siempre la clavija principal de la toma de corriente antes de retirar cualquier tapa del gabinete.\n' +
      '2. Esperar obligatoriamente al menos 3 minutos para que los capacitores electrolíticos del circuito primario se descarguen por completo.\n' +
      '3. Emplear pulsera antiestática aterrizada al manipular tarjetas lógicas y circuitos integrados sensibles.',
    attributes: {
      has_error_code: 'no',
      error_code_type: 'ninguno',
      component_type: 'seguridad_precaucion',
      hardware_affected: 'gabinete_capacitores'
    },
    keywords: ['seguridad', 'capacitores', 'descarga', 'choque', 'electrico', 'abrir', 'gabinete', 'precaucion']
  },

  // GARANTÍAS
  {
    id: 'gar-plazos',
    categorySlug: 'garantias',
    title: 'Plazos de Cobertura de Garantía por Tipo de Componente',
    documentTitle: 'Póliza y Procedimiento Maestro de Garantías',
    documentFilename: 'poliza_maestra_garantias.txt',
    summary: '24 meses en chasis mecánico, 12 meses en partes electrónicas, 6 meses en baterías y 90 días en cables.',
    fullProcedure:
      'PLAZOS OFICIALES DE COBERTURA:\n' +
      '• Chasis estructural y componentes mecánicos pesados: 24 meses naturales a partir de la fecha de facturación.\n' +
      '• Componentes electrónicos, fuentes y tarjetas madre: 12 meses naturales.\n' +
      '• Baterías recargables y acumuladores de energía: 6 meses naturales contra defecto de celda.\n' +
      '• Accesorios menores, cables y piezas de desgaste: 90 días naturales.',
    attributes: {
      warranty_topic: 'plazos_cobertura',
      purchase_time: 'dentro_plazo',
      equipment_state: 'normal'
    },
    keywords: ['plazo', 'vigencia', 'duracion', 'tiempo', 'meses', '12 meses', '24 meses', 'chasis', 'tarjetas']
  },
  {
    id: 'gar-requisitos',
    categorySlug: 'garantias',
    title: 'Requisitos y Documentación para Trámite de Garantía',
    documentTitle: 'Póliza y Procedimiento Maestro de Garantías',
    documentFilename: 'poliza_maestra_garantias.txt',
    summary: 'Factura fiscal CFDI, número de serie legible, equipo completo y formato F-GAR-01.',
    fullProcedure:
      'REQUISITOS OBLIGATORIOS PARA RECLAMO DE GARANTÍA:\n' +
      'a) Factura original de compra o comprobante digital con folio fiscal CFDI legible.\n' +
      'b) Número de serie original visible en la placa del fabricante (no mutilado ni alterado).\n' +
      'c) Equipo completo con accesorios indispensables para su operación de prueba.\n' +
      'd) Llenado del formato oficial de reporte de falla F-GAR-01.',
    attributes: {
      warranty_topic: 'requisitos_tramite',
      purchase_time: 'dentro_plazo',
      equipment_state: 'normal'
    },
    keywords: ['requisitos', 'factura', 'cfdi', 'serie', 'tramite', 'documentos', 'formato', 'f-gar-01', 'reclamar']
  },
  {
    id: 'gar-exclusiones',
    categorySlug: 'garantias',
    title: 'Causas Expresas de Pérdida / Invalidación de Garantía',
    documentTitle: 'Póliza y Procedimiento Maestro de Garantías',
    documentFilename: 'poliza_maestra_garantias.txt',
    summary: 'Sellos violados, descargas eléctricas, daño físico por golpes o humedad, y firmware no autorizado.',
    fullProcedure:
      'CIRCUNSTANCIAS QUE INVALIDAN LA GARANTÍA SIN EXCEPCIÓN:\n' +
      '1. Sellos de seguridad violados, rotos o evidencia de apertura por talleres no certificados.\n' +
      '2. Daños ocasionados por variaciones de voltaje superiores al +/-10% o falta de tierra física.\n' +
      '3. Golpes, caídas, deformaciones del chasis o presencia de humedad/líquidos internos.\n' +
      '4. Instalación de firmware o modificaciones no aprobadas por Vicente Soluciones.',
    attributes: {
      warranty_topic: 'exclusiones_invalidez',
      purchase_time: 'indiferente',
      equipment_state: 'intervenido_o_golpeado'
    },
    keywords: ['invalida', 'pierde', 'exclusion', 'sellos', 'golpe', 'humedad', 'descarga', 'modificado', 'anula']
  },
  {
    id: 'gar-sla',
    categorySlug: 'garantias',
    title: 'Tiempos de Respuesta y SLA de Diagnóstico y Reparación',
    documentTitle: 'Póliza y Procedimiento Maestro de Garantías',
    documentFilename: 'poliza_maestra_garantias.txt',
    summary: 'Diagnóstico en 48 hrs hábiles, reparación de 3 a 5 días hábiles, reemplazo si supera 15 días.',
    fullProcedure:
      'TIEMPOS OFICIALES DE SERVICIO (SLA):\n' +
      '• Diagnóstico inicial: máximo 48 horas hábiles a partir del ingreso al taller autorizado.\n' +
      '• Reparación en taller: 3 a 5 días hábiles con refacciones en stock nacional.\n' +
      '• Reemplazo por equipo nuevo: autorizado si el tiempo de reparación supera 15 días hábiles o ante falla reincidente por 3ra vez.',
    attributes: {
      warranty_topic: 'tiempos_sla',
      purchase_time: 'dentro_plazo',
      equipment_state: 'normal'
    },
    keywords: ['sla', 'tiempo de respuesta', 'cuanto tarda', 'dias', '48 horas', 'reparacion', 'reemplazo nuevo']
  },

  // CEDIS Y LOGÍSTICA
  {
    id: 'cedis-citas',
    categorySlug: 'cedis',
    title: 'Horarios de Recepción y Citas de Descarga en CEDIS',
    documentTitle: 'Manual de Operaciones Logísticas y Recepción en CEDIS',
    documentFilename: 'manual_operaciones_cedis_2026.txt',
    summary: 'Lunes a Viernes 07:00 a 14:00 hrs. Cita previa obligatoria con 24h de anticipación vía SGL-Web.',
    fullProcedure:
      'PROTOCOLO DE CITAS EN CEDIS:\n' +
      '• Horario de recepción: Lunes a Viernes de 07:00 a 14:00 horas exclusivamente.\n' +
      '• No se recibe ninguna unidad sin folio de cita previa tramitado en el portal SGL-Web con mínimo 24 horas de antelación.\n' +
      '• Tolerancia en caseta: Máximo 15 minutos respecto a la hora asignada; tras ese tiempo la cita queda cancelada automáticamente.',
    attributes: {
      cedis_topic: 'citas_horarios',
      shipment_type: 'proveedor_descarga',
      cedis_location: 'todos'
    },
    keywords: ['citas', 'horario', 'descarga', 'sgl-web', 'proveedores', 'tolerancia', '15 minutos', 'caseta']
  },
  {
    id: 'cedis-tarimas',
    categorySlug: 'cedis',
    title: 'Especificaciones de Tarimas, Embalaje y Estiba en CEDIS',
    documentTitle: 'Manual de Operaciones Logísticas y Recepción en CEDIS',
    documentFilename: 'manual_operaciones_cedis_2026.txt',
    summary: 'Tarima americana estándar (1.00 x 1.20 m), estiba máx 1.65m y emplaye calibre 60.',
    fullProcedure:
      'REQUISITOS DE EMBALAJE Y TARIMAS:\n' +
      '• Tarima de madera estándar tipo americana (1.00 m x 1.20 m) de 4 entradas sin tablas rotas ni clavos salidos.\n' +
      '• Altura máxima de la estiba: 1.65 m (incluyendo la base de madera de la tarima).\n' +
      '• Emplaye obligatorio con película plástica calibre mínimo 60 sujeta desde la base de la tarima.\n' +
      '• Etiqueta visible en 2 caras con SKU, descripción, lote y número de cajas.',
    attributes: {
      cedis_topic: 'tarimas_embalaje',
      shipment_type: 'proveedor_descarga',
      cedis_location: 'todos'
    },
    keywords: ['tarimas', 'emplaye', 'embalaje', 'playo', 'estiba', '1.65', 'madera', 'etiquetas']
  },
  {
    id: 'cedis-ubicaciones',
    categorySlug: 'cedis',
    title: 'Directorio y Ubicaciones de Centros de Distribución (CEDIS)',
    documentTitle: 'Manual de Operaciones Logísticas y Recepción en CEDIS',
    documentFilename: 'manual_operaciones_cedis_2026.txt',
    summary: 'CEDIS Central San Martín Obispo (Edo. Méx.) y CEDIS Regional Norte (Apodaca, N.L.).',
    fullProcedure:
      'CENTROS DE DISTRIBUCIÓN ACTIVOS:\n' +
      '1. CEDIS Central San Martín Obispo:\n' +
      '   Dirección: Parque Industrial San Martín Obispo Park II, Nave 4, Cuautitlán Izcalli, Edo. Méx., C.P. 54769.\n' +
      '   Capacidad: 25,000 tarimas, 32 andenes de carga/descarga.\n' +
      '2. CEDIS Regional Norte (Apodaca):\n' +
      '   Dirección: Parque Industrial Huinalá, Carretera Apodaca-Huinalá Km 3.5, Apodaca, N.L.\n' +
      '   Capacidad: 10,000 tarimas, 14 andenes.',
    attributes: {
      cedis_topic: 'ubicaciones_directorio',
      shipment_type: 'general',
      cedis_location: 'cuautitlan_apodaca'
    },
    keywords: ['ubicacion', 'direccion', 'san martin obispo', 'cuautitlan', 'izcalli', 'apodaca', 'monterrey', 'nave industrial', 'nave 4']
  },

  // TIENDAS Y AGENCIAS
  {
    id: 'tiendas-directorio',
    categorySlug: 'tiendas_agencias',
    title: 'Directorio y Teléfonos de Sucursales y Agencias Autorizadas',
    documentTitle: 'Manual Operativo: Red de Tiendas y Agencias Autorizadas 2026',
    documentFilename: 'manual_red_tiendas_2026.txt',
    summary: 'Sucursales en CDMX (Insurgentes Sur), Monterrey (Constitución), Guadalajara y Puebla.',
    fullProcedure:
      'DIRECTORIO NACIONAL DE SUCURSALES:\n' +
      '• Sucursal Centro (CDMX): Av. Insurgentes Sur #1450, Col. Actipan, Benito Juárez. Tel: (55) 5543-8900 ext. 101/102. Cuenta con taller de diagnóstico y Click & Collect.\n' +
      '• Sucursal Norte (Monterrey): Av. Constitución #2180 Poniente, Col. Obispado. Tel: (81) 8345-7720.\n' +
      '• Sucursal Occidente (Guadalajara): Calzada Independencia Norte #890, Col. La Federacha. Tel: (33) 3612-4411.\n' +
      '• Agencia Autorizada Puebla (TecnoSur): Blvd. Hermanos Serdán #320, Col. Las Hadas. Tel: (222) 249-1830.',
    attributes: {
      store_topic: 'directorio_telefonos',
      location_region: 'cdmx_mty_gdl'
    },
    keywords: ['sucursales', 'tiendas', 'direcciones', 'telefonos', 'cdmx', 'monterrey', 'guadalajara', 'puebla', 'insurgentes']
  },
  {
    id: 'tiendas-horarios',
    categorySlug: 'tiendas_agencias',
    title: 'Horarios de Atención y Política de Recolección en Mostrador',
    documentTitle: 'Manual Operativo: Red de Tiendas y Agencias Autorizadas 2026',
    documentFilename: 'manual_red_tiendas_2026.txt',
    summary: 'Lunes a Viernes 08:30 a 19:30, Sábados 09:00 a 14:30. INE requerida para entrega.',
    fullProcedure:
      'HORARIOS Y RECOLECCIÓN EN MOSTRADOR:\n' +
      '• Horario: Lunes a Viernes de 08:30 a 19:30 horas (horario corrido). Sábados de 09:00 a 14:30 horas. Domingos cerrado.\n' +
      '• Recolección personal: Presentar INE o Pasaporte vigente y número de pedido.\n' +
      '• Recolección por tercero: Carta poder simple firmada, copia de INE del comprador y copia de INE de quien recoge.\n' +
      '• Inspección obligatoria física frente al cliente antes de sellar la póliza.',
    attributes: {
      store_topic: 'horarios_recoleccion',
      location_region: 'todas'
    },
    keywords: ['horario', 'abren', 'cierran', 'recoleccion', 'mostrador', 'carta poder', 'ine', 'tercero', 'click collect']
  },

  // ATENCIÓN AL CLIENTE
  {
    id: 'cli-facturacion',
    categorySlug: 'cliente',
    title: 'Requisitos y Plazos de Facturación Electrónica (CFDI 4.0)',
    documentTitle: 'Manual de Políticas de Atención al Cliente, Facturación y Reembolsos',
    documentFilename: 'politicas_atencion_facturacion_cliente.txt',
    summary: 'Plazo: mes en curso y hasta 72 horas del mes siguiente. Requiere RFC, Razón Social sin régimen, CP y Régimen fiscal.',
    fullProcedure:
      'POLÍTICA DE FACTURACIÓN CFDI 4.0:\n' +
      '• Plazo máximo: El cliente dispone del mes de compra y hasta 72 horas naturales del mes posterior para solicitar su CFDI.\n' +
      '• Datos fiscales indispensables:\n' +
      '  1. RFC completo con homoclave.\n' +
      '  2. Nombre o Razón Social exacta sin el régimen societario (ej. sin S.A. de C.V.).\n' +
      '  3. Código Postal del domicilio fiscal registrado en el SAT.\n' +
      '  4. Régimen Fiscal y Uso de CFDI.\n' +
      '• Envíe su ticket a facturacion@vicentesoluciones.com.mx o ingrese al portal de autofacturación.',
    attributes: {
      client_topic: 'facturacion_cfdi',
      issue_nature: 'fiscal'
    },
    keywords: ['factura', 'facturacion', 'cfdi', 'sat', 'rfc', 'razon social', 'codigo postal', '72 horas', 'impuestos']
  },
  {
    id: 'cli-devoluciones',
    categorySlug: 'cliente',
    title: 'Políticas de Devolución por Arrepentimiento y Tiempos de Reembolso',
    documentTitle: 'Manual de Políticas de Atención al Cliente, Facturación y Reembolsos',
    documentFilename: 'politicas_atencion_facturacion_cliente.txt',
    summary: 'Plazo: 7 días naturales con empaque cerrado sin instalar. Reembolso: 5 a 15 días tarjeta, 72h SPEI.',
    fullProcedure:
      'DEVOLUCIONES Y REEMBOLSOS:\n' +
      '• Plazo: Hasta 7 días naturales posteriores a la recepción del producto.\n' +
      '• Condiciones: Empaque original cerrado, accesorios intactos y sin haber sido instalado o energizado. Aplica 10% de re-almacenamiento si la causa no es atribuible a defecto.\n' +
      '• Tiempos de reembolso:\n' +
      '  - Tarjeta de crédito/débito: 5 a 15 días hábiles bancarios.\n' +
      '  - Transferencia SPEI: 72 horas hábiles tras revisión técnica en almacén.',
    attributes: {
      client_topic: 'devolucion_reembolso',
      issue_nature: 'comercial'
    },
    keywords: ['devolucion', 'reembolso', 'arrepentimiento', '7 dias', 'dinero', 'spei', 'tarjeta', 'devolver', '10%']
  },

  // INFORMACIÓN GENERAL
  {
    id: 'info-contacto',
    categorySlug: 'informacion',
    title: 'Canales Corporativos de Contacto, Conmutador y Aviso de Privacidad',
    documentTitle: 'Compendio Institucional, Misión y Canales Oficiales',
    documentFilename: 'compendio_institucional_vicente.txt',
    summary: 'Línea gratuita 800-842-3683 (800-VICENTE), correo soporte@, portal web y derechos ARCO.',
    fullProcedure:
      'CANALES CORPORATIVOS OFICIALES:\n' +
      '• Conmutador Nacional: 800-842-3683 (800-VICENTE). Lunes a Viernes de 08:00 a 20:00 hrs, Sábados de 09:00 a 14:00 hrs.\n' +
      '• Soporte Técnico: soporte@vicentesoluciones.com.mx\n' +
      '• Ventas y Atención General: contacto@vicentesoluciones.com.mx\n' +
      '• Portal de Autoservicio: https://portal.vicentesoluciones.com.mx\n' +
      '• Protección de Datos y Derechos ARCO: privacidad@vicentesoluciones.com.mx de acuerdo con la LFPDPPP.',
    attributes: {
      info_topic: 'contacto_privacidad',
      channel_type: 'todos'
    },
    keywords: ['conmutador', 'telefono', 'correo', 'contacto', '800', 'privacidad', 'arco', 'portal', 'horario atencion']
  }
];

// =========================================================================
// 2. BASE DE PREGUNTAS AKINATOR DISCRIMINATORIAS POR CATEGORÍA
// =========================================================================
export const AKINATOR_QUESTIONS: AkinatorQuestion[] = [
  // Preguntas Diagnóstico
  {
    id: 'q-diag-has-code',
    categorySlug: 'diagnostico',
    text: '¿El panel frontal del equipo muestra algún código de error numérico (por ejemplo: E01, E02, E04, E08)?',
    attributeKey: 'has_error_code',
    options: [
      { label: 'Sí, muestra un código', value: 'si' },
      { label: 'No muestra código / Pregunta general', value: 'no' }
    ]
  },
  {
    id: 'q-diag-code-type',
    categorySlug: 'diagnostico',
    text: '¿Cuál es el código de error específico que visualizas en la pantalla?',
    attributeKey: 'error_code_type',
    options: [
      { label: 'E01 (Alimentación / Voltaje)', value: 'e01_voltaje' },
      { label: 'E02 (Sobrecalentamiento)', value: 'e02_temperatura' },
      { label: 'E03 (Sensor de Posición / Encoder)', value: 'e03_encoder' },
      { label: 'E04 (Sobrecarga de Motor)', value: 'e04_motor' },
      { label: 'E05 (Comunicación / Display)', value: 'e05_comunicacion' },
      { label: 'E08 (Falla de Memoria EEPROM)', value: 'e08_eeprom' }
    ]
  },

  // Preguntas Garantías
  {
    id: 'q-gar-topic',
    categorySlug: 'garantias',
    text: '¿Qué aspecto de la garantía necesitas consultar?',
    attributeKey: 'warranty_topic',
    options: [
      { label: 'Plazos de cobertura (meses)', value: 'plazos_cobertura' },
      { label: 'Requisitos y documentos para reclamar', value: 'requisitos_tramite' },
      { label: 'Causas que anulan / invalidan la póliza', value: 'exclusiones_invalidez' },
      { label: 'Tiempos de respuesta (SLA de reparación)', value: 'tiempos_sla' }
    ]
  },

  // Preguntas CEDIS
  {
    id: 'q-cedis-topic',
    categorySlug: 'cedis',
    text: '¿Sobre qué procedimiento del CEDIS necesitas información?',
    attributeKey: 'cedis_topic',
    options: [
      { label: 'Citas de descarga y horarios en caseta', value: 'citas_horarios' },
      { label: 'Requisitos de tarimas, embalaje y estiba', value: 'tarimas_embalaje' },
      { label: 'Ubicaciones y direcciones de los CEDIS', value: 'ubicaciones_directorio' }
    ]
  },

  // Preguntas Tiendas
  {
    id: 'q-store-topic',
    categorySlug: 'tiendas_agencias',
    text: '¿Qué información sobre tiendas y sucursales estás buscando?',
    attributeKey: 'store_topic',
    options: [
      { label: 'Direcciones y teléfonos de sucursales', value: 'directorio_telefonos' },
      { label: 'Horarios y recolección de pedidos con INE', value: 'horarios_recoleccion' }
    ]
  },

  // Preguntas Atención al Cliente
  {
    id: 'q-cli-topic',
    categorySlug: 'cliente',
    text: '¿Cuál es el trámite o gestión que necesitas realizar?',
    attributeKey: 'client_topic',
    options: [
      { label: 'Facturación Electrónica (CFDI 4.0)', value: 'facturacion_cfdi' },
      { label: 'Devolución de producto y reembolso de dinero', value: 'devolucion_reembolso' }
    ]
  }
];

const STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para',
  'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus', 'le', 'ya', 'o',
  'este', 'si', 'porque', 'esta', 'son', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'ser',
  'tiene', 'tambien', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos',
  'durante', 'uno', 'les', 'ni', 'contra', 'otros', 'cual', 'cuales', 'es', 'unos', 'unas',
  'hacia', 'segun', 'ante', 'bajo', 'tras', 'mediante', 'cada', 'algun', 'alguna', 'hacer'
]);

// Helper to normalize strings for exact and fuzzy matching
function clean(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Motor Akinator 100% Determinista (Sin IA / Basado en Base de Datos de Reglas)
 */
export function executeAkinatorSearch(
  user: User,
  categorySlug: string,
  userQuery: string,
  answersHistory: Record<string, string> = {}
): AkinatorStepResult {
  const config = db.getConfig();
  const emptyMessage = config.emptyResultMessage;

  const isAll = !categorySlug || categorySlug === 'all';

  // 1. Filtrar objetivos autorizados (por categoría solicitada o búsqueda global)
  const categoryTargets = KNOWLEDGE_TARGETS.filter((t) => {
    if (isAll) {
      if (user.role === 'admin' || user.allowedCategories.includes('*')) return true;
      return user.allowedCategories.includes(t.categorySlug);
    }
    return t.categorySlug === categorySlug;
  });

  if (categoryTargets.length === 0) {
    return {
      certainty: 0,
      status: 'NOT_FOUND',
      answerText: emptyMessage,
      citations: [],
      candidatesCount: 0
    };
  }

  const queryNorm = clean(userQuery);
  const queryWords = queryNorm
    .split(' ')
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  // 2. Puntuar candidatos según respuestas de Akinator e input del usuario
  interface ScoredTarget {
    target: KnowledgeTarget;
    score: number;
  }

  const scoredTargets: ScoredTarget[] = [];

  for (const target of categoryTargets) {
    let score = 0;

    // Coincidencia con respuestas dadas en el árbol Akinator
    let matchesAnswers = true;
    for (const [attrKey, expectedVal] of Object.entries(answersHistory)) {
      if (attrKey === 'global_category') {
        if (target.categorySlug !== expectedVal) {
          matchesAnswers = false;
          break;
        } else {
          score += 15.0;
        }
      } else if (target.attributes[attrKey]) {
        if (target.attributes[attrKey] === expectedVal) {
          score += 12.0;
        } else {
          matchesAnswers = false;
          break;
        }
      }
    }

    if (!matchesAnswers) {
      continue; // Descartado por el árbol de preguntas estilo Akinator
    }

    // Coincidencia con palabras clave del objetivo (con límites de palabra)
    let keywordScore = 0;
    for (const kw of target.keywords) {
      const kwNorm = clean(kw);
      const kwRegex = new RegExp(`(^|\\s)${kwNorm}(\\s|$)`);
      if (kwRegex.test(queryNorm)) {
        keywordScore += 6.0;
      }
    }
    score += keywordScore;

    // Coincidencia exacta de tokens por palabra completa
    const titleTokens = new Set(clean(target.title).split(' '));
    const summaryTokens = new Set(clean(target.summary).split(' '));
    const procedureTokens = new Set(clean(target.fullProcedure).split(' '));

    let titleSummaryScore = 0;
    for (const word of queryWords) {
      if (titleTokens.has(word)) {
        titleSummaryScore += 4.0;
      }
      if (summaryTokens.has(word)) {
        titleSummaryScore += 2.5;
      }
      if (procedureTokens.has(word)) {
        score += 1.5;
      }
    }
    score += titleSummaryScore;

    // REGLA CRÍTICA DE COINCIDENCIA TEMÁTICA:
    // Para considerarse coincidencia válida en la base de datos, la consulta debe coincidir con:
    // palabras clave curadas (keywordScore > 0), título o resumen (titleSummaryScore > 0),
    // o haber sido respondida explícitamente en el árbol Akinator.
    const hasGenuineTopicMatch =
      keywordScore > 0 ||
      titleSummaryScore > 0 ||
      Object.keys(answersHistory).length > 0;

    if (hasGenuineTopicMatch && score >= 3.5) {
      scoredTargets.push({ target, score });
    }
  }

  // Ordenar de mayor a menor puntuación
  scoredTargets.sort((a, b) => b.score - a.score);

  // Si no existen coincidencias documentales en la base de datos
  if (scoredTargets.length === 0) {
    return {
      certainty: 0,
      status: 'NOT_FOUND',
      answerText: emptyMessage,
      citations: [],
      candidatesCount: 0
    };
  }

  const bestMatch = scoredTargets[0];
  const candidatesCount = scoredTargets.length;
  const hasUserAnswers = Object.keys(answersHistory).length > 0;

  // 3. Evaluar certeza matemática:
  // Si tenemos un claro ganador con puntaje muy alto y amplia ventaja, o si ya se respondieron preguntas del árbol
  const isDecisive =
    (candidatesCount === 1 && (bestMatch.score >= 10.0 || hasUserAnswers)) ||
    (bestMatch && bestMatch.score >= 18.0 && (scoredTargets.length === 1 || bestMatch.score - (scoredTargets[1]?.score || 0) >= 12.0)) ||
    Object.keys(answersHistory).length >= 2;

  if (isDecisive && bestMatch && bestMatch.score > 0) {
    const t = bestMatch.target;
    const secondScore = scoredTargets[1]?.score || 0;
    const certaintyPct = Math.min(100, Math.max(90, Math.round((bestMatch.score / (bestMatch.score + secondScore + 0.1)) * 100)));

    const citation: Citation = {
      documentId: t.id,
      documentTitle: t.documentTitle,
      categorySlug: t.categorySlug,
      chunkId: `chunk-${t.id}-0`,
      excerpt: t.summary,
      relevanceScore: Math.round(bestMatch.score * 10) / 10
    };

    const finalAnswer =
      `🎯 **Resultado Validado en Base de Datos (Certeza: ${certaintyPct}%):**\n\n` +
      `### ${t.title}\n` +
      `*Fuente Oficial: ${t.documentTitle} (${t.documentFilename})*\n\n` +
      `${t.fullProcedure}\n\n` +
      `---\n` +
      `✅ *Respuesta calculada mediante motor de decisión determinista en base de datos (Sin alucinación ni uso de IA externa).*`;

    return {
      certainty: certaintyPct,
      status: 'SOLVED',
      solvedTarget: t,
      answerText: finalAnswer,
      citations: [citation],
      candidatesCount: 1
    };
  }

  // 4. Si aún no hay certeza suficiente, elegir la siguiente mejor pregunta discriminatoria (Akinator)
  const candidateCategories = Array.from(new Set(scoredTargets.map((s) => s.target.categorySlug)));

  let nextQ: AkinatorQuestion | undefined;

  // Si los candidatos pertenecen a múltiples categorías diferentes, preguntar primero el área
  if (candidateCategories.length > 1 && !answersHistory['global_category']) {
    const CATEGORY_LABELS: Record<string, string> = {
      tiendas_agencias: 'Tiendas y Sucursales',
      garantias: 'Garantías y Políticas',
      cedis: 'CEDIS y Logística',
      diagnostico: 'Diagnóstico Técnico y Errores',
      cliente: 'Atención al Cliente y Facturación',
      informacion: 'Información Institucional'
    };

    nextQ = {
      id: 'q-global-category',
      categorySlug: 'all',
      text: '¿A cuál de las siguientes áreas o procesos corresponde tu consulta?',
      attributeKey: 'global_category',
      options: candidateCategories.map((slug) => ({
        label: CATEGORY_LABELS[slug] || slug,
        value: slug
      }))
    };
  } else {
    // Si los candidatos están dentro de una misma categoría o ya se seleccionó categoría
    const targetCat = candidateCategories[0] || categorySlug;
    const categoryQuestions = AKINATOR_QUESTIONS.filter(
      (q) => q.categorySlug === targetCat || (isAll && candidateCategories.includes(q.categorySlug))
    );
    const unansweredQuestions = categoryQuestions.filter(
      (q) => answersHistory[q.attributeKey] === undefined
    );

    if (unansweredQuestions.length > 0) {
      // Elegir pregunta que discrimine los candidatos actuales
      nextQ =
        unansweredQuestions.find((q) =>
          scoredTargets.some((s) => s.target.attributes[q.attributeKey] !== undefined)
        ) || unansweredQuestions[0];
    }
  }

  if (nextQ) {
    const initialCertainty = Math.min(75, Math.max(35, Math.round(100 / Math.max(candidatesCount, 2))));

    return {
      certainty: initialCertainty,
      status: 'QUESTIONING',
      nextQuestion: nextQ,
      answerText:
        `Vicente ha identificado **${scoredTargets.length} posibilidades** coincidentes en la base de datos documental.\n\n` +
        `Para guiarte a la respuesta exacta y validar el procedimiento oficial correspondiente:\n\n` +
        `👉 **${nextQ.text}**`,
      citations: bestMatch
        ? [
            {
              documentId: bestMatch.target.id,
              documentTitle: bestMatch.target.documentTitle,
              categorySlug: bestMatch.target.categorySlug,
              chunkId: `chunk-${bestMatch.target.id}-0`,
              excerpt: bestMatch.target.summary,
              relevanceScore: 5.0
            }
          ]
        : [],
      candidatesCount: scoredTargets.length
    };
  }

  // Si se agotaron las preguntas, entregar el mejor candidato
  if (bestMatch) {
    const t = bestMatch.target;
    return {
      certainty: 88,
      status: 'SOLVED',
      solvedTarget: t,
      answerText:
        `📋 **Documentación identificada en base de datos:**\n\n` +
        `### ${t.title}\n\n` +
        `${t.fullProcedure}`,
      citations: [
        {
          documentId: t.id,
          documentTitle: t.documentTitle,
          categorySlug: t.categorySlug,
          chunkId: `chunk-${t.id}-0`,
          excerpt: t.summary,
          relevanceScore: 6.0
        }
      ],
      candidatesCount: 1
    };
  }

  return {
    certainty: 0,
    status: 'NOT_FOUND',
    answerText: emptyMessage,
    citations: [],
    candidatesCount: 0
  };
}
