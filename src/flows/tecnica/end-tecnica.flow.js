import { addKeyword, utils } from '@builderbot/bot';
import { soportePrincipalFlow } from './main-tecnica.flow.js';

const text = [{ body: 'Si (*volver al menú principal*)' }, { body: 'NO' }];

export const preFinishTecnicaFlow = addKeyword(
  utils.setEvent('TECNICA_FINISH_FLOW')
).addAnswer(
  '¿Tiene otra Consulta? (*ingresa solo números*)' +
    text.map((b) => `\n${b.body}`),
  {
    capture: true,
    // buttons: [{ body: 'Si (volver al menú principal)' }, { body: 'NO' }],
  },
  async (ctx, { gotoFlow }) => {
    const opt = ctx.body;

    switch (true) {
      case opt.toLocaleLowerCase().contains('si'):
        return gotoFlow(soportePrincipalFlow);
      default:
        return gotoFlow(finishTecnicaFlow);
    }
  }
);

export const finishTecnicaFlow = addKeyword(['salir']).addAnswer(
  'Gracias por Comunicarse con *Cooperativa Telefónica Centenario*',
  null,
  async (_, { endFlow }) => {
    return endFlow('Para mas información visite *www.ctc8309.com.ar*');
  }
);
