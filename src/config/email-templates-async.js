const templateCache = new Map();

export async function getEmailTemplate(name) {
  if (templateCache.has(name)) {
    return templateCache.get(name);
  }
  try {
    const { EMAIL_TEMPLATES } = await import('./email-templates.js');
    if (!EMAIL_TEMPLATES[name]) {
      console.warn(`[EmailTemplates] Template not found: ${name}`);
      return null;
    }
    const template = EMAIL_TEMPLATES[name];
    templateCache.set(name, template);
    return template;
  } catch (e) {
    console.error(`[EmailTemplates] Failed to load template ${name}:`, e.message);
    return null;
  }
}

export async function getAllEmailTemplates() {
  if (templateCache.has('__all__')) {
    return templateCache.get('__all__');
  }
  try {
    const { EMAIL_TEMPLATES } = await import('./email-templates.js');
    templateCache.set('__all__', EMAIL_TEMPLATES);
    return EMAIL_TEMPLATES;
  } catch (e) {
    console.error('[EmailTemplates] Failed to load all templates:', e.message);
    return {};
  }
}
