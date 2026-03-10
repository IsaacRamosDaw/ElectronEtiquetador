/**
 * Obtiene el color de una etiqueta consultando la configuración del modelo.
 * 
 * @param {string} type - 'attributes', 'categories' o 'entities'
 * @param {string} groupOrCatName - El nombre del grupo o categoría
 * @param {string} valueName - El valor específico de la etiqueta
 * @param {object} model - La configuración del modelo (JSON)
 * @returns {string} - El color en formato hex o un gris por defecto
 */
export const getTagColor = (type, groupOrCatName, valueName, model) => {
    if (!model) return "#94a3b8";

    if (type === 'categories') {
        const cat = model[2].categories.find(c => c.name === groupOrCatName);
        return cat ? cat.color : "#94a3b8";
    }

    if (type === 'attributes') {
        const attrConfig = model[1].attributes.find(g => Object.keys(g)[0] === groupOrCatName);
        if (attrConfig) {
            const groupData = attrConfig[groupOrCatName];
            const valueConfig = groupData.values.find(v => v.name === valueName);
            return valueConfig ? (valueConfig.color || groupData.color) : groupData.color;
        }
        return "#94a3b8";
    }

    if (type === 'entities') {
        const entGroup = model[3].entities.find(g => g.values.find(v => v.name === valueName));
        return entGroup ? entGroup.color : "#94a3b8";
    }

    return "#94a3b8";
};
