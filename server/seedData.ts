import { Category, KnowledgeDocument, SystemConfig, User } from './types.ts';
import crypto from 'crypto';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_vicente_salt_2026').digest('hex');
}

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-tiendas',
    slug: 'tiendas_agencias',
    name: 'Tiendas y Agencias',
    description: 'Directorio nacional, sucursales, agencias autorizadas, horarios y servicios en mostrador.',
    icon: 'Store',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-garantias',
    slug: 'garantias',
    name: 'Garantías',
    description: 'Políticas oficiales, coberturas, exclusiones, tiempos de resolución y requisitos de reclamo.',
    icon: 'ShieldCheck',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-cedis',
    slug: 'cedis',
    name: 'CEDIS y Logística',
    description: 'Centros de distribución, citas de descarga, embalaje, tarimas y tiempos de entrega.',
    icon: 'Truck',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-diagnostico',
    slug: 'diagnostico',
    name: 'Diagnóstico Técnico',
    description: 'Manual de resolución de fallas, códigos de error (E01 a E08), pruebas de voltaje y componentes.',
    icon: 'Wrench',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-informacion',
    slug: 'informacion',
    name: 'Información General',
    description: 'Historia institucional, canales oficiales de atención, aviso de privacidad y conmutador.',
    icon: 'Building2',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-cliente',
    slug: 'cliente',
    name: 'Atención al Cliente',
    description: 'Emisión de facturas CFDI 4.0, devoluciones, quejas, aclaraciones y actualización de datos.',
    icon: 'UserCheck',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const SEED_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    passwordHash: hashPassword('admin123'),
    name: 'Ing. Carlos Mendoza (Administrador)',
    role: 'admin',
    allowedCategories: ['tiendas_agencias', 'garantias', 'cedis', 'diagnostico', 'informacion', 'cliente'],
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-agente',
    username: 'agente.soporte',
    passwordHash: hashPassword('agente123'),
    name: 'Lic. Laura Rivas (Soporte Técnico & Garantías)',
    role: 'agent',
    allowedCategories: ['garantias', 'diagnostico', 'cliente'],
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-logistica',
    username: 'logistica.cedis',
    passwordHash: hashPassword('cedis123'),
    name: 'Roberto Gómez (Operaciones Logística)',
    role: 'user',
    allowedCategories: ['cedis', 'tiendas_agencias'],
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-cliente',
    username: 'cliente.consulta',
    passwordHash: hashPassword('cliente123'),
    name: 'María Fernanda Cruz (Atención al Cliente)',
    role: 'user',
    allowedCategories: ['cliente', 'informacion'],
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const SEED_CONFIG: SystemConfig = {
  assistantName: 'Vicente',
  emptyResultMessage: 'No encontré esa respuesta en las fuentes internas. Para mantenerme dentro de los documentos, no voy a improvisar.',
  maxRequestsPerMinute: 60,
  strictRAGMode: true,
  retentionDays: 90,
  updatedAt: '2026-01-01T00:00:00.000Z'
};

export const SEED_DOCUMENTS: Omit<KnowledgeDocument, 'chunksCount'>[] = [
  {
    id: 'doc-tiendas-01',
    categoryId: 'cat-tiendas',
    title: 'Manual Operativo: Red de Tiendas y Agencias Autorizadas 2026',
    filename: 'manual_red_tiendas_2026.txt',
    fileType: 'text/plain',
    fileSize: 4200,
    createdAt: '2026-01-15T09:00:00.000Z',
    rawContent: `RED NACIONAL DE TIENDAS Y AGENCIAS AUTORIZADAS VICENTE CORP
Versión Oficial Vigente: Enero 2026.

1. HORARIOS GENERALES DE ATENCIÓN EN MOSTRADOR
- Tiendas Propias Metropolitanas (CDMX, Guadalajara, Monterrey):
  Lunes a Viernes: 08:30 a 19:30 horas (horario corrido).
  Sábados: 09:00 a 14:30 horas.
  Domingos y días festivos oficiales: Cerrado.
- Agencias Autorizadas Regionales:
  Lunes a Viernes: 09:00 a 18:00 horas.
  Sábados: 09:00 a 13:00 horas.

2. DIRECTORIO PRINCIPAL DE SUCURSALES Y AGENCIAS
- Sucursal Centro (CDMX):
  Dirección: Av. Insurgentes Sur #1450, Col. Actipan, Benito Juárez, CDMX.
  Teléfono Directo: (55) 5543-8900 ext. 101 y 102.
  Servicios: Mostrador de venta, recepción de garantías, taller de diagnóstico rápido y recolección para compras en línea (Click & Collect).
- Sucursal Norte (Monterrey):
  Dirección: Av. Constitución #2180 Poniente, Col. Obispado, Monterrey, N.L.
  Teléfono Directo: (81) 8345-7720.
  Servicios: Venta mayoreo, refacciones originales y módulo de atención a transportistas.
- Sucursal Occidente (Guadalajara):
  Dirección: Calzada Independencia Norte #890, Col. La Federacha, Guadalajara, Jal.
  Teléfono Directo: (33) 3612-4411.
  Servicios: Ventas y centro de servicio regional.
- Agencia Autorizada Puebla (Socio Aliado TecnoSur):
  Dirección: Blvd. Hermanos Serdán #320, Col. Las Hadas, Puebla, Pue.
  Teléfono Directo: (222) 249-1830.

3. POLÍTICA DE ATENCIÓN EN MOSTRADOR
- El cliente debe presentar identificación oficial vigente (INE o Pasaporte) para recolectar pedidos pagados previamente.
- En caso de recoger un tercero, se requiere carta poder simple, copia de INE del titular y copia de INE de quien recoge.
- Todo producto entregado en tienda debe ser inspeccionado visualmente frente al cliente antes de sellar la póliza de entrega.`
  },
  {
    id: 'doc-garantias-01',
    categoryId: 'cat-garantias',
    title: 'Póliza y Procedimiento Maestro de Garantías',
    filename: 'poliza_maestra_garantias.txt',
    fileType: 'text/plain',
    fileSize: 4950,
    createdAt: '2026-01-10T10:30:00.000Z',
    rawContent: `POLÍTICA MAESTRA DE GARANTÍAS Y REEMPLAZOS
Documento Normativo GTO-2026-v3.

1. PLAZOS DE COBERTURA ESTÁNDAR
- Componentes mecánicos y chasis estructural: 24 meses naturales a partir de la fecha de facturación.
- Componentes electrónicos, tarjetas lógicas y fuentes de poder: 12 meses naturales.
- Accesorios menores, cables, empaques y piezas de desgaste normal: 90 días naturales.
- Baterías recargables y acumuladores: 6 meses naturales contra defecto de celda (no cubre degradación natural por ciclos de carga).

2. CONDICIONES Y REQUISITOS PARA VALIDAR LA GARANTÍA
Para tramitar un reclamo de garantía, el usuario debe presentar:
a) Factura original de compra o comprobante digital con folio fiscal (CFDI).
b) Número de serie legible del equipo (no alterado ni removido de la etiqueta del fabricante).
c) Equipo completo con sus accesorios originales indispensables para la prueba.
d) Descripción detallada de la falla en el formato oficial F-GAR-01.

3. EXCLUSIONES EXPRESAS (PÉRDIDA DE GARANTÍA)
La garantía quedará invalidada sin excepción bajo las siguientes circunstancias:
- Sellos de seguridad violados, rotos o intervenidos por personal no certificado.
- Daño ocasionado por descargas eléctricas, fluctuaciones de voltaje fuera de +/- 10% del nominal, o falta de tierra física adecuada.
- Daño físico atribuible a golpes, caídas, deformaciones mecánicas o exposición a humedad/líquidos.
- Instalación de firmware no autorizado o modificaciones al circuito original.
- Falta de mantenimiento preventivo estipulado en el manual de usuario cada 6 meses.

4. TIEMPOS DE RESPUESTA Y RESOLUCIÓN (SLA)
- Diagnóstico inicial: máximo 48 horas hábiles a partir de la recepción en centro autorizado.
- Reparación en taller: 3 a 5 días hábiles si se cuenta con refacción en stock nacional.
- Reemplazo por equipo nuevo: se autoriza si la reparación supera los 15 días hábiles o si la falla es reincidente por tercera ocasión consecutiva en el mismo componente.`
  },
  {
    id: 'doc-cedis-01',
    categoryId: 'cat-cedis',
    title: 'Manual de Operaciones Logísticas y Recepción en CEDIS',
    filename: 'manual_operaciones_cedis_2026.txt',
    fileType: 'text/plain',
    fileSize: 4600,
    createdAt: '2026-01-12T14:00:00.000Z',
    rawContent: `CENTROS DE DISTRIBUCIÓN (CEDIS) - PROTOCOLO DE RECEPCIÓN Y LOGÍSTICA
Código de Procedimiento: LOG-CEDIS-04.

1. UBICACIÓN DE CENTROS DE DISTRIBUCIÓN
- CEDIS Central San Martín Obispo (Estado de México):
  Dirección: Parque Industrial San Martín Obispo Park II, Nave 4, Cuautitlán Izcalli, Edo. Méx., C.P. 54769.
  Capacidad: 25,000 tarimas, 32 andenes de carga y descarga.
- CEDIS Regional Norte (Apodaca):
  Dirección: Parque Industrial Huinalá, Carretera Apodaca-Huinalá Km 3.5, Apodaca, N.L.
  Capacidad: 10,000 tarimas, 14 andenes.

2. HORARIOS Y CITAS DE DESCARGA PARA PROVEEDORES Y TRANSPORTISTAS
- Horario de recepción de proveedores: Lunes a Viernes de 07:00 a 14:00 horas exclusivamente.
- No se recibe ninguna unidad sin número de cita previa gestionado mediante el portal de citas (SGL-Web) con al menos 24 horas de anticipación.
- Tolerancia máxima de arribo a caseta: 15 minutos respecto a la hora asignada en cita. Si el transportista llega con más de 15 minutos de retraso, la cita queda cancelada y debe reprogramarse según disponibilidad de andén.

3. ESPECIFICACIONES DE TARIMAS Y EMBALAJE OBLIGATORIO
- Se requiere uso exclusivo de tarima de madera estándar tipo americana (1.00 m x 1.20 m) de 4 entradas, sin tablas rotas ni clavos expuestos.
- Altura máxima de la estiba: 1.65 m (incluyendo la tarima).
- Cada tarima debe estar flejada y envuelta con película plástica extensible (playo) de calibre mínimo 60, asegurando la carga desde la base de madera.
- Cada tarima debe portar etiqueta visible en al menos dos caras con: SKU, descripción, lote, cantidad de cajas y fecha de empaque.

4. TIEMPOS DE PROCESAMIENTO Y SURTIDO A CLIENTES (SLA)
- Pedidos locales metropolitanos: Preparación en 24 horas, entrega en 48 horas hábiles.
- Pedidos foráneos nacionales: Despacho a paquetería en 24 horas hábiles; entrega final sujeta a zona geográfica de la transportadora (3 a 5 días hábiles).`
  },
  {
    id: 'doc-diagnostico-01',
    categoryId: 'cat-diagnostico',
    title: 'Guía de Diagnóstico Técnico de Fallas y Códigos de Error',
    filename: 'guia_diagnostico_errores_tecnicos.txt',
    fileType: 'text/plain',
    fileSize: 5100,
    createdAt: '2026-01-18T11:20:00.000Z',
    rawContent: `GUÍA MAESTRA DE DIAGNÓSTICO TÉCNICO Y CÓDIGOS DE ERROR
Serie de Equipos Industriales y Comerciales Vicente.

1. TABLA OFICIAL DE CÓDIGOS DE ERROR EN PANEL DIGITAL
- Código E01 (Falla de Alimentación Principal):
  Causa: Voltaje de entrada inferior a 95 VAC o superior a 135 VAC.
  Procedimiento: Medir con multímetro calibrado entre Fase y Neutro en el tomacorriente. Verificar que exista tierra física con voltaje menor a 1.5 VAC entre Neutro y Tierra. Si el voltaje es correcto, revisar el fusible F1 de 10A en la tarjeta de potencia.
- Código E02 (Sobrecalentamiento del Módulo de Potencia):
  Causa: Sensor de temperatura NTC detecta más de 85°C durante 10 segundos continuos.
  Procedimiento: Apagar el equipo, inspeccionar si las ranuras de ventilación están obstruidas por polvo. Medir resistencia del sensor NTC (valor nominal 10k Ohm a 25°C). Verificar que el ventilador de enfriamiento FAN1 gire libremente y reciba 12 VDC.
- Código E03 (Falla en Sensor de Posición / Encoder):
  Causa: Ausencia de pulsos de retroalimentación tras 500 ms de comando de giro.
  Procedimiento: Revisar cableado de 4 hilos del encoder óptico. Limpiar disco codificador con alcohol isopropílico. Si el LED indicador del encoder no parpadea al girar manualmente el eje, reemplazar el ensamble del sensor.
- Código E04 (Sobrecarga de Corriente en Motor):
  Causa: El consumo supera los 8.5 Amperes por más de 3 segundos consecutivos.
  Procedimiento: Inspeccionar posible atasco mecánico o baleros trabados. Desacoplar banda de transmisión y medir corriente en vacío (debe ser menor a 1.2A).
- Código E05 (Error de Comunicación UART / Tarjeta Frontal):
  Causa: Pérdida de sincronía serial entre tarjeta principal y panel táctil.
  Procedimiento: Revisar cable plano flexible (ribbon cable). Comprobar que no haya pines doblados ni corrosión.
- Código E08 (Falla Crítica de Memoria EEPROM):
  Causa: Checksum corrupto en configuración de fábrica.
  Procedimiento: Ejecutar reinicio de fábrica manteniendo pulsados los botones 'RESET' y 'MODO' durante 7 segundos continuos al encender. Si el código persiste, requiere flasheo de firmware con interfaz ISP autorizada.

2. PROTOCOLO OBLIGATORIO DE SEGURIDAD
- Siempre desconectar la clavija de alimentación antes de remover la cubierta del gabinete.
- Esperar al menos 3 minutos para que los capacitores electrolíticos del circuito primario se descarguen por completo antes de manipular la placa electrónica.`
  },
  {
    id: 'doc-informacion-01',
    categoryId: 'cat-informacion',
    title: 'Compendio Institucional, Misión y Canales Oficiales',
    filename: 'compendio_institucional_vicente.txt',
    fileType: 'text/plain',
    fileSize: 3800,
    createdAt: '2026-01-05T08:00:00.000Z',
    rawContent: `INFORMACIÓN INSTITUCIONAL Y CANALES CORPORATIVOS OFICIALES
Vicente Soluciones Industriales y Comerciales S.A. de C.V.

1. MISIÓN Y PROPÓSITO
Proveer equipamiento de alta fiabilidad, repuestos originales y asesoría técnica de primer nivel para mantener la continuidad operativa de nuestros clientes y distribuidores en toda la República Mexicana.

2. CANALES CORPORATIVOS DE CONTACTO
- Conmutador Central Nacional: 800-842-3683 (800-VICENTE).
  Horario de atención telefónica: Lunes a Viernes de 08:00 a 20:00 horas, Sábados de 09:00 a 14:00 horas.
- Correo Electrónico Institucional: contacto@vicentesoluciones.com.mx
- Mesa de Ayuda Técnica Especializada: soporte@vicentesoluciones.com.mx
- Portal Web de Clientes y Distribuidores: https://portal.vicentesoluciones.com.mx

3. AVISO DE PRIVACIDAD Y PROTECCIÓN DE DATOS
Vicente Soluciones trata los datos personales de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Los datos recabados en chats, llamadas y formularios se utilizan exclusivamente con fines de facturación, cumplimiento de garantías y soporte técnico. No comercializamos ni transferimos bases de datos a terceros sin consentimiento expreso. Para ejercer derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), escribir a: privacidad@vicentesoluciones.com.mx.`
  },
  {
    id: 'doc-cliente-01',
    categoryId: 'cat-cliente',
    title: 'Manual de Políticas de Atención al Cliente, Facturación y Reembolsos',
    filename: 'politicas_atencion_facturacion_cliente.txt',
    fileType: 'text/plain',
    fileSize: 4500,
    createdAt: '2026-01-08T12:00:00.000Z',
    rawContent: `MANUAL DE ATENCIÓN AL CLIENTE, EMISIÓN DE FACTURAS Y REEMBOLSOS
Código: SAC-POL-2026.

1. POLÍTICA DE FACTURACIÓN ELECTRÓNICA (CFDI 4.0)
- Plazo máximo para solicitar factura: El cliente dispone del mes en curso y hasta 72 horas naturales del mes posterior a su compra para emitir su factura a través del portal de autofacturación o enviando su ticket a facturacion@vicentesoluciones.com.mx.
- Requisitos fiscales indispensables según Anexo 20 del SAT:
  * RFC completo con homoclave.
  * Nombre o Razón Social exacta tal como figura en la Constancia de Situación Fiscal (sin régimen de capital como S.A. de C.V.).
  * Código Postal del domicilio fiscal del receptor.
  * Régimen fiscal del receptor.
  * Uso de CFDI correspondiente (por ejemplo: G01 Adquisición de mercancías, G03 Gastos en general).
- Las solicitudes de corrección de factura deben realizarse dentro del mismo mes de emisión.

2. POLÍTICA DE DEVOLUCIONES Y REEMBOLSOS COMERCIALES
- Plazo de devolución por arrepentimiento de compra: hasta 7 días naturales posteriores a la entrega del producto.
- Requisitos:
  * Empaque original sin roturas, manuales intactos y sellos de accesorios sin despegar.
  * El producto no debe haber sido encendido, energizado ni instalado.
  * Aplica un cargo administrativo por re-almacenamiento del 10% sobre el valor del producto si la devolución no obedece a un defecto atribuible a la empresa.
- Reembolsos:
  * Pagos con tarjeta de débito/crédito: la reversa se refleja en un plazo de 5 a 15 días hábiles bancarios.
  * Pagos por transferencia SPEI: reembolso en cuenta CLABE dentro de 72 horas hábiles tras la aprobación física del producto devuelto.

3. ATENCIÓN A QUEJAS Y ESCALAMIENTOS
- Nivel 1 (Atención Telefónica y Chat Vicente): Resolución inmediata o canalización con ticket de seguimiento (SLA de 24 horas).
- Nivel 2 (Jefatura de Calidad y Servicio al Cliente): Casos que involucren reclamaciones formales o discrepancias de facturación (SLA de 48 horas hábiles).`
  }
];
