import { addKeyword, utils } from '@builderbot/bot';

export const soporteAsistenciaFlow = addKeyword(
  utils.setEvent('ASISTENCIA_INSTALACION_TECNICA')
).addAnswer(
  `Seleccioná una opción:  
1️⃣ Asistencia de línea (Ingresar N° de ticket, teléfono o DNI)  
2️⃣ Instalación de línea (Ingresar DNI)`,
  { capture: true },
  async (_, { endFlow }) => {
    return endFlow(
      `✅ ¡Perfecto! Un técnico se comunicará a la brevedad para coordinar tu solicitud.`
    );
  }
);
