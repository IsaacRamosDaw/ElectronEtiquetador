/**
 * Procesa una línea de texto e inserta etiquetas descriptivas o decorativas.
 * 
 * @param {object} lineData - Los datos de la línea (line, attributes, categories, entities)
 * @param {function} formatTagOpen - Función que devuelve el string de apertura: (tag, relatedAttrs) => string
 * @param {function} formatTagClose - Función que devuelve el string de cierre: (tag) => string
 * @returns {string} - El texto procesado
 */
export const processLineTags = (lineData, formatTagOpen, formatTagClose) => {
    const lineAttributes = lineData.attributes || [];
    const lineCategories = lineData.categories || [];
    const lineEntities = lineData.entities || [];

    //? Limpia el código de hablante (ej: "E_1: ") para procesar solo el texto
    let lineText = lineData.line.replace(/^[EI]_\d*[:\s]*/, '').trim();

    //? Crea eventos de "apertura" y "cierre" para cada tag
    const events = [];
    const tags = [
        ...lineCategories.map(c => ({ ...c, kind: 'category' })),
        ...lineEntities.map(e => ({ ...e, kind: 'entity' }))
    ];

    tags.forEach(tag => {
        events.push({ type: 'open', pos: tag.start, tag });
        events.push({ type: 'close', pos: tag.end, tag });
    });

    //? Ordena los eventos para que los tags anidados se cierren en el orden correcto
    events.sort((a, b) => {
        if (a.pos !== b.pos) return a.pos - b.pos;
        if (a.type !== b.type) return a.type === 'close' ? -1 : 1;
        if (a.type === 'open') {
            if (a.tag.end !== b.tag.end) return b.tag.end - a.tag.end;
            return a.tag.value.localeCompare(b.tag.value);
        } else {
            if (a.tag.start !== b.tag.start) return b.tag.start - a.tag.start;
            return b.tag.value.localeCompare(a.tag.value);
        }
    });

    let result = "";
    let lastPos = 0;
    
    events.forEach(ev => {
        result += lineText.slice(lastPos, ev.pos);
        if (ev.type === 'open') {
            const relatedAttrs = lineAttributes.filter(a => a.start === ev.tag.start && a.end === ev.tag.end);
            result += formatTagOpen(ev.tag, relatedAttrs);
        } else {
            result += formatTagClose(ev.tag);
        }
        lastPos = ev.pos;
    });
    
    result += lineText.slice(lastPos);
    return result;
};

/**
 * Genera el formato de exportación TXT: <TAG attr="val">... </TAG>
 */
export const formatTxtOpen = (tag, relatedAttrs) => {
    const attrStr = relatedAttrs.length > 0 ? (tag.kind === 'category' ? '; ' : '') + relatedAttrs.map(a => `${a.type}="${a.value}"`).join('; ') : "";
    return `<${tag.value}${attrStr}>`;
};

export const formatTxtClose = (tag) => {
    return `</${tag.value}>`;
};
