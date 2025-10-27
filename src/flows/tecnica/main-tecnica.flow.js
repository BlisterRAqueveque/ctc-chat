import { addKeyword, utils } from '@builderbot/bot';
import { soporteInternetFlow } from './internet.flow.js';
import { soporteTelefoniaFlow } from './telefonia.flow.js';
import { soporteAsistenciaFlow } from './asistencia-instalacion.flow.js';
import { soporteOtrosFlow } from './otros.flow.js';

const text = [
  { body: '1. *No tengo servicio de internet*' },
  { body: '2. *No tengo servicio de telefonía*' },
  { body: '3. *Consultar por asistencia o instalación de línea*' },
  { body: '4. *Otros*' },
];

export const soportePrincipalFlow = addKeyword(
  utils.setEvent('MAIN_TECNICA')
).addAnswer(
  '¿En qué puedo ayudarte?' + text.map((b) => `\n${b.body}`),
  { capture: true },
  async (ctx, { gotoFlow, fallBack }) => {
    const opt = ctx.body.trim();

    switch (opt) {
      case '1':
        return gotoFlow(soporteInternetFlow);
      case '2':
        return gotoFlow(soporteTelefoniaFlow);
      case '3':
        return gotoFlow(soporteAsistenciaFlow);
      case '4':
        return gotoFlow(soporteOtrosFlow);
      default:
        return fallBack('Por favor, seleccioná una opción válida (1 al 4)');
    }
  }
);
