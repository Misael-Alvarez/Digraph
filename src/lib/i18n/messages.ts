/**
 * UI copy.
 *
 * A deliberately small runtime rather than next-intl: this editor is a
 * client-only surface with no locale routing, and Fase 5 restructures the routes
 * anyway. The `t('key')` shape matches next-intl's, so swapping later is a
 * find-and-replace on the provider, not on every call site.
 */
export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = { es: 'Español', en: 'English' };

const en = {
  'app.title': 'Architecture Studio',
  'app.untitled': 'Untitled diagram',

  'tool.select': 'Select',
  'tool.boundary': 'Cloud boundary',
  'tool.subboundary': 'Sub-boundary',
  'tool.group': 'Service group',
  'tool.item': 'Add service',
  'tool.connector': 'Connect',

  'menu.file': 'File',
  'menu.edit': 'Edit',
  'menu.view': 'View',
  'menu.insert': 'Insert',

  'action.new': 'New canvas',
  'action.open': 'Open project…',
  'action.save': 'Save project',
  'action.importMarkdown': 'Import from Markdown…',
  'action.exportMarkdown': 'Export Markdown',
  'action.exportSvg': 'Export SVG',
  'action.exportPng': 'Export PNG',
  'action.undo': 'Undo',
  'action.redo': 'Redo',
  'action.selectAll': 'Select all',
  'action.deselect': 'Deselect',
  'action.delete': 'Delete',
  'action.duplicate': 'Duplicate',
  'action.copy': 'Copy',
  'action.paste': 'Paste',
  'action.autoLayout': 'Auto layout',
  'action.bringToFront': 'Bring to front',
  'action.sendToBack': 'Send to back',
  'action.zoomIn': 'Zoom in',
  'action.zoomOut': 'Zoom out',
  'action.zoomFit': 'Fit to view',
  'action.zoomReset': 'Reset zoom',
  'action.toggleTheme': 'Toggle dark mode',
  'action.toggleGrid': 'Toggle grid snap',
  'action.toggleMinimap': 'Toggle minimap',
  'action.toggleCode': 'Toggle code view',
  'action.exportMermaid': 'Copy as Mermaid',
  'action.templates': 'Templates…',
  'action.shortcuts': 'Keyboard shortcuts',
  'action.switchCloud': 'Switch cloud…',
  'action.clear': 'Clear canvas',

  'palette.placeholder': 'Search services and commands…',
  'palette.services': 'Services',
  'palette.commands': 'Commands',
  'palette.empty': 'No matches',

  'inspector.title': 'Properties',
  'inspector.empty': 'Select a shape to edit it',
  'inspector.multi': '{count} shapes selected',
  'inspector.content': 'Content',
  'inspector.appearance': 'Appearance',
  'inspector.cloud': 'Cloud',
  'inspector.position': 'Position',
  'inspector.label': 'Title',
  'inspector.subtitle': 'Subtitle',
  'inspector.note': 'Note',
  'inspector.icon': 'Icon',
  'inspector.fill': 'Fill',
  'inspector.equivalents': 'Equivalent services',
  'inspector.moveUp': 'Move up',
  'inspector.moveDown': 'Move down',

  'canvas.empty.title': 'Start your architecture',
  'canvas.empty.search': 'Press {key} to find a service',
  'canvas.empty.template': 'Or load a template',
  'canvas.empty.import': 'Or import from Markdown',

  'status.saved': 'Saved',
  'status.saving': 'Saving…',
  'status.error': 'Could not save',
  'status.shapes': '{count} shapes',
  'status.connectors': '{count} connections',

  'hint.select': 'Click to select, drag to move, Shift+click to add to the selection',
  'hint.boundary': 'Click the canvas to place a cloud boundary',
  'hint.subboundary': 'Click the canvas to place a sub-boundary',
  'hint.group': 'Click the canvas to place a service group',
  'hint.item': 'Click a group to add a service to it',
  'hint.connectorSource': 'Click the source shape',
  'hint.connectorTarget': 'Click the target shape to finish the connection',

  'toast.switched': 'Switched {count} services to {cloud}',
  'toast.noEquivalent': '{count} had no equivalent: {names}',
  'toast.cleared': 'Canvas cleared',
  'toast.invalidFile': 'That file is not a valid diagram',
  'toast.exported': 'Exported {name}',

  'modal.templates.title': 'Templates',
  'modal.templates.subtitle': 'Loading a template replaces the current diagram.',
  'modal.markdown.title': 'Import from Markdown',
  'modal.markdown.subtitle': 'One service per line. Use "A -> B : label" for connections.',
  'modal.markdown.import': 'Import',
  'modal.markdown.chooseFile': 'Choose file…',
  'modal.shortcuts.title': 'Keyboard shortcuts',
  'modal.cancel': 'Cancel',
  'modal.close': 'Close',
} as const;

export type MessageKey = keyof typeof en;

const es: Record<MessageKey, string> = {
  'app.title': 'Architecture Studio',
  'app.untitled': 'Diagrama sin título',

  'tool.select': 'Seleccionar',
  'tool.boundary': 'Frontera de nube',
  'tool.subboundary': 'Subfrontera',
  'tool.group': 'Grupo de servicios',
  'tool.item': 'Añadir servicio',
  'tool.connector': 'Conectar',

  'menu.file': 'Archivo',
  'menu.edit': 'Editar',
  'menu.view': 'Ver',
  'menu.insert': 'Insertar',

  'action.new': 'Lienzo nuevo',
  'action.open': 'Abrir proyecto…',
  'action.save': 'Guardar proyecto',
  'action.importMarkdown': 'Importar desde Markdown…',
  'action.exportMarkdown': 'Exportar Markdown',
  'action.exportSvg': 'Exportar SVG',
  'action.exportPng': 'Exportar PNG',
  'action.undo': 'Deshacer',
  'action.redo': 'Rehacer',
  'action.selectAll': 'Seleccionar todo',
  'action.deselect': 'Deseleccionar',
  'action.delete': 'Eliminar',
  'action.duplicate': 'Duplicar',
  'action.copy': 'Copiar',
  'action.paste': 'Pegar',
  'action.autoLayout': 'Organizar automáticamente',
  'action.bringToFront': 'Traer al frente',
  'action.sendToBack': 'Enviar al fondo',
  'action.zoomIn': 'Acercar',
  'action.zoomOut': 'Alejar',
  'action.zoomFit': 'Ajustar a la vista',
  'action.zoomReset': 'Restablecer zoom',
  'action.toggleTheme': 'Modo oscuro',
  'action.toggleGrid': 'Ajuste a la cuadrícula',
  'action.toggleMinimap': 'Minimapa',
  'action.toggleCode': 'Vista de código',
  'action.exportMermaid': 'Copiar como Mermaid',
  'action.templates': 'Plantillas…',
  'action.shortcuts': 'Atajos de teclado',
  'action.switchCloud': 'Cambiar de nube…',
  'action.clear': 'Vaciar lienzo',

  'palette.placeholder': 'Busca servicios y comandos…',
  'palette.services': 'Servicios',
  'palette.commands': 'Comandos',
  'palette.empty': 'Sin resultados',

  'inspector.title': 'Propiedades',
  'inspector.empty': 'Selecciona una forma para editarla',
  'inspector.multi': '{count} formas seleccionadas',
  'inspector.content': 'Contenido',
  'inspector.appearance': 'Apariencia',
  'inspector.cloud': 'Nube',
  'inspector.position': 'Posición',
  'inspector.label': 'Título',
  'inspector.subtitle': 'Subtítulo',
  'inspector.note': 'Nota',
  'inspector.icon': 'Icono',
  'inspector.fill': 'Relleno',
  'inspector.equivalents': 'Servicios equivalentes',
  'inspector.moveUp': 'Subir',
  'inspector.moveDown': 'Bajar',

  'canvas.empty.title': 'Empieza tu arquitectura',
  'canvas.empty.search': 'Pulsa {key} para buscar un servicio',
  'canvas.empty.template': 'O carga una plantilla',
  'canvas.empty.import': 'O importa desde Markdown',

  'status.saved': 'Guardado',
  'status.saving': 'Guardando…',
  'status.error': 'No se pudo guardar',
  'status.shapes': '{count} formas',
  'status.connectors': '{count} conexiones',

  'hint.select':
    'Clic para seleccionar, arrastra para mover, Mayús+clic para añadir a la selección',
  'hint.boundary': 'Haz clic en el lienzo para colocar una frontera de nube',
  'hint.subboundary': 'Haz clic en el lienzo para colocar una subfrontera',
  'hint.group': 'Haz clic en el lienzo para colocar un grupo de servicios',
  'hint.item': 'Haz clic en un grupo para añadirle un servicio',
  'hint.connectorSource': 'Haz clic en la forma de origen',
  'hint.connectorTarget': 'Haz clic en la forma de destino para terminar la conexión',

  'toast.switched': '{count} servicios cambiados a {cloud}',
  'toast.noEquivalent': '{count} sin equivalente: {names}',
  'toast.cleared': 'Lienzo vaciado',
  'toast.invalidFile': 'Ese archivo no es un diagrama válido',
  'toast.exported': '{name} exportado',

  'modal.templates.title': 'Plantillas',
  'modal.templates.subtitle': 'Cargar una plantilla reemplaza el diagrama actual.',
  'modal.markdown.title': 'Importar desde Markdown',
  'modal.markdown.subtitle': 'Un servicio por línea. Usa "A -> B : etiqueta" para las conexiones.',
  'modal.markdown.import': 'Importar',
  'modal.markdown.chooseFile': 'Elegir archivo…',
  'modal.shortcuts.title': 'Atajos de teclado',
  'modal.cancel': 'Cancelar',
  'modal.close': 'Cerrar',
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, es };

/** Substitutes `{name}` placeholders. Missing values are left visible on purpose. */
export function format(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  values?: Record<string, string | number>,
): string {
  return format(MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key, values);
}
