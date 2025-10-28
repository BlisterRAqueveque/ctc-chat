import { addKeyword, utils } from '@builderbot/bot';

export const soporteAsistenciaFlow = addKeyword(
  utils.setEvent('ASISTENCIA_INSTALACION_TECNICA')
).addAnswer(
  'Seleccioná una opción:\n1. Asistencia de línea (Ingresar N° de ticket, teléfono o DNI)\n2. Instalación de línea (Ingresar DNI)',
  { capture: true },
  async (_, { endFlow }) => {
    return endFlow(
      '✅ ¡Perfecto! Un técnico se comunicará a la brevedad para coordinar tu solicitud.'
    );
  }
);
