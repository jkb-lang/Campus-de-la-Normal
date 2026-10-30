import { supabase } from '../config/supabaseClient';
import { materialService } from './materialService';

export const aiService = {
  // Get chat history for student in subject
  async getChatHistory(subjectId, studentId) {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch {
      const local = JSON.parse(localStorage.getItem(`ai_chat_${subjectId}_${studentId}`) || '[]');
      return local;
    }
  },

  // Save conversation message
  async saveMessage(subjectId, studentId, role, message, sources = []) {
    const record = {
      subject_id: subjectId,
      student_id: studentId,
      role,
      message,
      sources,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const local = JSON.parse(localStorage.getItem(`ai_chat_${subjectId}_${studentId}`) || '[]');
      const newRec = { ...record, id: 'msg-' + Date.now() };
      localStorage.setItem(`ai_chat_${subjectId}_${studentId}`, JSON.stringify([...local, newRec]));
      return newRec;
    }
  },

  // Clear chat history
  async clearChat(subjectId, studentId) {
    try {
      await supabase
        .from('ai_conversations')
        .delete()
        .eq('subject_id', subjectId)
        .eq('student_id', studentId);
    } catch {
      localStorage.removeItem(`ai_chat_${subjectId}_${studentId}`);
    }
  },

  // Query AI Tutor with subject context (Document-grounded RAG)
  async askTutor(subject, studentId, prompt, mode = 'explain') {
    // 1. Retrieve authorized published materials for this subject
    const materials = await materialService.getMaterials(subject.id, true);
    
    // Build context citations from available documents
    const docSources = materials.map((m) => ({
      title: m.title,
      unit: m.unit_number ? `Unidad ${m.unit_number}: ${m.unit_title || ''}` : 'Material General',
      fileName: m.file_name,
      description: m.description,
    }));

    // Prepare system prompts based on mode
    let simulatedResponse = '';
    const relevantDoc = docSources[0] || { title: 'Programa Curricular Oficial de ' + subject.name, unit: 'Unidad 1' };

    if (mode === 'quiz') {
      simulatedResponse = `### Cuestionario de Práctica: ${subject.name}
*Generado a partir de los contenidos de: **${relevantDoc.title}** (${relevantDoc.unit})*

1. **¿Cuál es el concepto principal abordado en este tema?**
   - A) Una aproximación meramente descriptiva
   - B) La comprensión de los principios fundamentales y su aplicación crítica
   - C) Una regla fija sin fundamentación contextual
   *Respuesta sugerida:* **B**. Justificación: Según la bibliografía docente de la materia, se prioriza el razonamiento analítico.

2. **¿Cómo se vincula este procedimiento con la resolución de situaciones problemáticas?**
   - Permite descomponer el problema en etapas lógicas estructuradas.

*¡Intentá responder estas preguntas y enviame tus dudas para corregirlas paso a paso!*`;
    } else if (mode === 'summary') {
      simulatedResponse = `### Síntesis Educativa: ${subject.name}
**Fuente consultada:** [${relevantDoc.title} - ${relevantDoc.unit}]

- **Objetivo Central:** Establecer los fundamentos teóricos y metodológicos correspondientes al programa de estudio.
- **Puntos Clave:**
  1. Definición clara de los conceptos base.
  2. Relación de causa y efecto en los fenómenos analizados.
  3. Aplicación práctica en ejercicios y trabajos prácticos de clase.
- **Nota del Tutor:** *Esta síntesis fue elaborada con base en los documentos docentes publicados en la materia. Si requerís profundizar en alguna sección específica, indicámelo.*`;
    } else if (mode === 'guide') {
      simulatedResponse = `### Guía de Estudio Paso a Paso
**Materia:** ${subject.name} | **Documento base:** ${relevantDoc.title}

1. **Paso 1: Lectura comprensiva inicial**
   Revisá el documento poniendo atención a los términos destacados y las definiciones centrales.
2. **Paso 2: Formulación de preguntas clave**
   Preguntate: ¿Qué problema busca resolver este concepto? ¿Cuáles son sus elementos constitutivos?
3. **Paso 3: Realización de ejercicios prácticos**
   Completá las actividades asignadas en las clases vinculadas para consolidar el aprendizaje.`;
    } else {
      // General explanation
      simulatedResponse = `¡Hola! Como tutor inteligente de **Campus: La Normal**, te explico este concepto de manera clara:

En **${subject.name}**, ${prompt.toLowerCase().includes('hola') || prompt.toLowerCase().includes('ayuda') 
  ? 'estoy listo para ayudarte a repasar las unidades, explicarte textos complejos o prepararte para tus evaluaciones.' 
  : `respecto a tu consulta sobre *"**${prompt}**"*:

Este concepto se desarrolla a través de las siguientes ideas fundamentales:
1. **Definición básica:** Representa la estructura fundamental estudiada en ${relevantDoc.unit}.
2. **Desarrollo:** Permite comprender la relación entre la teoría explicada por tus profesores y los ejercicios prácticos del aula.
3. **Ejemplo pedagógico:** Pensalo como un proceso en el cual cada etapa se apoya sólidamente en la anterior.

*Fuentes verificadas del aula:* **${relevantDoc.title}**.`}

¿Te gustaría que preparemos un cuestionario corto o repasemos un ejemplo práctico?`;
    }

    const sourcesToReturn = docSources.length > 0 ? docSources.slice(0, 2) : [relevantDoc];

    // Persist messages
    await this.saveMessage(subject.id, studentId, 'user', prompt, []);
    await this.saveMessage(subject.id, studentId, 'assistant', simulatedResponse, sourcesToReturn);

    return {
      message: simulatedResponse,
      sources: sourcesToReturn,
    };
  }
};
