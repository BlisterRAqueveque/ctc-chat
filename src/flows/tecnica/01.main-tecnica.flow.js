import { addKeyword, utils } from '@builderbot/bot';
import { soporteInternetFlow } from './02.internet.flow.js';
import { soporteTelefoniaFlow } from './03.telefonia.flow.js';
import { soporteAsistenciaFlow } from './04.asistencia-instalacion.flow.js';
import { soporteOtrosFlow } from './05.otros.flow.js';

const text = [
  { body: '1. *No tengo servicio de internet*' },
  { body: '2. *No tengo servicio de telefonía*' },
  { body: '3. *Consultar por asistencia o instalación de línea*' },
  { body: '4. *Otros*' },
];

const soportePrincipalFlowText =
  '¿En qué puedo ayudarte? (*ingresa solo números*)' +
  text.map((b) => `\n${b.body}`);
  
export const soportePrincipalFlow = addKeyword(
  utils.setEvent('MAIN_TECNICA')
).addAnswer(
  soportePrincipalFlowText,
  { capture: true },
  async (ctx, { gotoFlow, fallBack }) => {
    const opt = ctx.body.trim();

    if (opt == 'salir') return;

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
        return fallBack(
          `Opción ingresada incorrecta.\n${soportePrincipalFlowText}`
        );
    }
  }
);
