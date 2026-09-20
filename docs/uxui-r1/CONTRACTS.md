# MLS EXPERIENCE REFINEMENT R1 — SHARED CONTRACTS

Estos contratos son obligatorios para todos los workstreams.

## Producto y arquitectura
C01. `content/` sigue siendo la fuente canónica editorial.
C02. El lector publicado nunca puede depender de Workers AI.
C03. Buscar es el nombre público para acceder a Virtuoso.
C04. Dentro de `/virtuoso`, Virtuoso conserva nombre, personalidad y rol de bibliotecario.
C05. Virtuoso y Profesor IA son funciones distintas.
C06. Virtuoso orienta; Profesor IA enseña y explica.
C07. BGE-M3 sigue siendo la base semántica existente.
C08. Gemma 4 no es fuente editorial; solo puede orientar/rerankear donde ya corresponda.
C09. La IA no puede inventar IDs, títulos ni rutas canónicas.
C10. Full-text sigue siendo fallback de búsqueda.
C11. No se añaden proveedores de IA pagados.
C12. No se modifica el corpus R32 dentro de este proyecto salvo autorización explícita.
C13. No se reintroduce contenido legacy.
C14. El contenido legible no debe bajar de 11 pt equivalente.
C15. Focus visible debe conservarse o mejorar.
C16. No se elimina funcionalidad offline existente.
C17. No se elimina compatibilidad móvil existente.
C18. No se introduce gamificación sin aprobación explícita.
C19. No se modifica una API pública sin compatibilidad o migración documentada.

## Trabajo multi-chat
C20. Ningún worker modifica `main`.
C21. Ningún worker despliega producción.
C22. Los PR de workers apuntan a `uxui-r1-integration`.
C23. Un worker no hace refactors de un dominio ajeno sin coordinación.
C24. Cuando un worker necesita un cambio ajeno, crea un DEPENDENCY REQUEST.
C25. Todo contrato nuevo razonablemente testeable debe incluir tests.
C26. Los cambios deben ser pequeños, reversibles y con alcance claro.
C27. No se eliminan fallbacks para simplificar implementación.
C28. Si producción y código discrepan, la experiencia real de producción manda para el diagnóstico.
C29. Chat 0 es el único integrador del programa.
C30. Un cambio que rompe recovery, canonicalidad, fallback, mobile o accesibilidad no puede integrarse.

## UX/UI
C31. Normalizar no significa homogeneizar: Home puede seguir oscuro, Virtuoso puede conservar personalidad propia y Profesor IA puede mantener acento propio.
C32. No se rediseña por moda; cada cambio debe resolver un problema verificable.
C33. Reducir fricción y carga cognitiva tiene prioridad sobre añadir controles.
C34. La navegación debe favorecer reconocimiento sobre memoria.
C35. La accesibilidad no puede degradarse por motivos estéticos.
