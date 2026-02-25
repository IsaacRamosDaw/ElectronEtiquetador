import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import "../style/createModelView.css"

export default function CreateModelView() {
  const navigate = useNavigate();
  const { modelName } = useParams();

  const [title, setTitle] = useState(modelName || '');
  const [loading, setLoading] = useState(!!modelName);
  const [attributes, setAttributes] = useState([]);
  const [categories, setCategories] = useState([]);

  // 1. Estado para crear una Categoría Nueva (Padre)
  const [newCatData, setNewCatData] = useState({ name: '', desc: '', color: '#ff00ff' });

  // 2. Estado para la subcategoría que estamos escribiendo actualmente
  // Guardamos el índice para saber en qué categoría estamos escribiendo
  const [activeSubData, setActiveSubData] = useState({ catIndex: null, name: '', color: '#00ffaa' });

  const [newAttrGroup, setNewAttrGroup] = useState('');
  const [newItemData, setNewItemData] = useState({ name: '', desc: '', color: '#00d4ff' });

  useEffect(() => {
    if (modelName) {
      (async () => {
        try {
          const result = await window.createModelAPI.getModelToEdit(modelName);
          if (result.success) {
            setTitle(result.data[0].title);
            setAttributes(result.data[1].attributes || []);
            setCategories(result.data[2].categories || []);
          }
        } catch (error) { console.error(error); } finally { setLoading(false); }
      })();
    }
  }, [modelName])

  // --- LÓGICA DE ATRIBUTOS ---
  const addAttributeGroup = () => {
    if (!newAttrGroup.trim()) return;
    setAttributes([...attributes, { [newAttrGroup]: [] }]);
    setNewAttrGroup('');
  };

  const addAttributeItem = (attrIndex, attrName) => {
    if (!newItemData.name.trim()) return;
    const newAttributes = [...attributes];
    newAttributes[attrIndex][attrName].push({
      id: Date.now().toString(),
      name: newItemData.name,
      description: newItemData.desc,
      color: newItemData.color
    });
    setAttributes(newAttributes);
    setNewItemData({ name: '', desc: '', color: '#00d4ff' });
  };

  const removeAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const removeAttributeItem = (attrIndex, attrName, itemIndex) => {
    const newAttributes = [...attributes];
    newAttributes[attrIndex][attrName].splice(itemIndex, 1);
    setAttributes(newAttributes);
  };

  // --- LÓGICA DE CATEGORÍAS ---
  const addCategory = () => {
    if (!newCatData.name.trim()) return;
    const newCategory = {
      id: Date.now().toString(),
      name: newCatData.name,
      color: newCatData.color,
      description: newCatData.desc,
      subCategories: []
    };
    setCategories([...categories, newCategory]);
    setNewCatData({ name: '', desc: '', color: '#ff00ff' }); // Limpiar formulario padre
  };

  const addSubCategory = (catIndex) => {
    if (!activeSubData.name.trim()) return;

    const newCategories = [...categories];
    const newSub = {
      id: Date.now().toString(),
      name: activeSubData.name,
      color: activeSubData.color,
      description: ""
    };

    newCategories[catIndex].subCategories.push(newSub);
    setCategories(newCategories);
    // Limpiar solo el estado de subcategoría
    setActiveSubData({ catIndex: null, name: '', color: '#00ffaa' });
  };

  const removeCategory = (index) => setCategories(categories.filter((_, i) => i !== index));
  const removeSubCategory = (catIndex, subIndex) => {
    const newCats = [...categories];
    newCats[catIndex].subCategories.splice(subIndex, 1);
    setCategories(newCats);
  };

  const handleSave = async () => {
    if (!title) return;
    const modelData = [{ title }, { attributes }, { categories }];
    const result = await window.createModelAPI.saveModel({ fileName: title, data: modelData });
    if (result.success) navigate('/');
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="launcher-wrapper">
      <div className="glass-panel create-model-wrapper">
        <header className="launcher-header">
          <h1 className="neon-text-blue">
            Etiquetador<span>{modelName ? 'Editar' : 'Configurar'} Modelo</span>
          </h1>
        </header>

        <main className="form-container">
          <div className="form-section">
            <div className="form-group">
              <label>Título del archivo (JSON)</label>
              <input
                type="text"
                className="neon-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!!modelName}
              />
            </div>
          </div>

          {/* SECCIÓN ATRIBUTOS */}
          <div className="form-section">
            <h3>Atributos</h3>

            {/* Input para crear el grupo padre */}
            <div className="add-item-panel">
              <input
                type="text"
                className="neon-input"
                placeholder="Nuevo grupo (ej: Sentimiento)"
                value={newAttrGroup}
                onChange={(e) => setNewAttrGroup(e.target.value)}
              />
              <button className="btn-secondary" onClick={addAttributeGroup}>+ Crear Grupo</button>
            </div>

            <ul className="item-list">
              {attributes.map((attr, i) => {
                const attrName = Object.keys(attr)[0];
                return (
                  <li key={i} className="attribute-item">
                    <div className="item-row">
                      <span className="purple-glow">◈ {attrName}</span>
                      <button className="btn-icon" onClick={() => removeAttribute(i)}>🗑️</button>
                    </div>

                    <ul className="sub-item-list">
                      {attr[attrName].map((item, j) => (
                        <li key={item.id} className="item-row">
                          <span style={{ color: item.color }}>●</span>
                          <span>{item.name}</span>
                          <button className="btn-icon" onClick={() => removeAttributeItem(i, attrName, j)}>×</button>
                        </li>
                      ))}
                    </ul>

                    {/* Formulario pequeño para añadir valores al grupo */}
                    <div className="inline-form">
                      <input type="text" placeholder="Valor" value={newItemData.name} onChange={e => setNewItemData({ ...newItemData, name: e.target.value })} />
                      <input type="color" value={newItemData.color} onChange={e => setNewItemData({ ...newItemData, color: e.target.value })} />
                      <button className="link-btn-alt" onClick={() => addAttributeItem(i, attrName)}>Añadir</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* SECCIÓN CATEGORÍAS */}
          <div className="form-section">
            <h3>Categorías Principales</h3>

            {/* PANEL PARA CREAR CATEGORÍA PADRE */}
            <div className="add-item-panel category-parent-form">
              <div className="input-row">
                <input type="text" className="neon-input" placeholder="Nombre Categoría (ej: Personajes)"
                  value={newCatData.name} onChange={e => setNewCatData({ ...newCatData, name: e.target.value })} />
                <input type="color" className="color-picker" value={newCatData.color} onChange={e => setNewCatData({ ...newCatData, color: e.target.value })} />
                <button className="btn-secondary" onClick={addCategory}>+ Crear Categoría</button>
              </div>
            </div>

            <ul className="item-list">
              {categories.map((cat, i) => (
                <li key={cat.id} className="category-card">
                  <div className="item-row main-cat">
                    <span style={{ color: cat.color }}>■</span>
                    <strong className="blue-glow">{cat.name}</strong>
                    <button className="btn-icon" onClick={() => removeCategory(i)}>🗑️</button>
                  </div>

                  {/* LISTA DE SUBCATEGORÍAS EXISTENTES */}
                  <ul className="sub-item-list">
                    {cat.subCategories.map((sub, j) => (
                      <li key={sub.id} className="item-row sub-cat">
                        <span style={{ color: sub.color }}>└─ {sub.name}</span>
                        <button className="btn-icon" onClick={() => removeSubCategory(i, j)}>×</button>
                      </li>
                    ))}
                  </ul>

                  {/* FORMULARIO ÚNICO PARA AÑADIR SUBCATEGORÍA A ESTA CATEGORÍA */}
                  <div className="inline-sub-form">
                    <input
                      type="text"
                      placeholder="Nueva subcategoría..."
                      value={activeSubData.catIndex === i ? activeSubData.name : ''}
                      onChange={e => setActiveSubData({ catIndex: i, name: e.target.value, color: activeSubData.color })}
                    />
                    <input
                      type="color"
                      value={activeSubData.catIndex === i ? activeSubData.color : '#00ffaa'}
                      onChange={e => setActiveSubData({ ...activeSubData, catIndex: i, color: e.target.value })}
                    />
                    <button className="link-btn-alt" onClick={() => addSubCategory(i)}>+ Añadir Sub</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </main>

        <footer className="modal-footer">
          <button className="btn-cancel" onClick={() => navigate('/')}>Cancelar</button>
          <button className="btn-save" onClick={handleSave}>Guardar Cambios</button>
        </footer>
      </div>
    </div>
  );
}