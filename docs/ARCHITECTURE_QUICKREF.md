# Arquitectura Rápida - Referencia para Agentes

Ver también: [docs/architecture.md](architecture.md), [PROJECT_ARCHITECTURE.md](../PROJECT_ARCHITECTURE.md), [ARCHITECTURE_GUIDE.md](../ARCHITECTURE_GUIDE.md)

## Dónde poner código
| Tipo | Ubicación |
|---|---|
| Pantalla nueva (feature) | eatures/<dominio>/screens/ |
| Hook de feature | eatures/<dominio>/hooks/ |
| Servicio de feature | eatures/<dominio>/services/ |
| Componente exclusivo feature | eatures/<dominio>/components/ |
| Guard/Context/Hook compartido | shared/* |
| Utilidad pura transversal | lib/ |
| Ruta Expo Router | pp/ (thin wrapper/re-export) |

## Reglas
- Sin dependencias cruzadas entre features
- Pantallas no concentran lógica compleja/consultas de negocio
- Consultas a Supabase van en servicios de feature (o excepciones justificadas)
- Componentes compartidos sin acceso directo a Supabase
- Usar lib/theme.js para estilos
- Mantener compatibilidad con imports existentes; usar shims si se mueve código

