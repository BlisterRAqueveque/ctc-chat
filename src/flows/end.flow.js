import { addKeyword, utils } from '@builderbot/bot';
import { mainMenuFlow } from './main.flow.js';

const text = [{ body: 'Si (*volver al menú principal*)' }, { body: 'NO' }];

export const preFinishFlow = addKeyword(
  utils.setEvent('FINISH_FLOW')
).addAnswer(
  '¿Tiene otra Consulta?' + text.map((b) => `\n${b.body}`),
  {
    capture: true,
    // buttons: [{ body: 'Si (volver al menú principal)' }, { body: 'NO' }],
  },
  async (ctx, { gotoFlow }) => {
    const opt = ctx.body;

    switch (true) {
      case opt.toLocaleLowerCase().contains('si'):
        return gotoFlow(mainMenuFlow);
      default:
        return gotoFlow(finishFlow);
    }
  }
);

export const finishFlow = addKeyword(['salir']).addAnswer(
  'Gracias por Comunicarse con *Cooperativa Telefónica Centenario*',
  null,
  async (_, { endFlow }) => {
    return endFlow('Para mas información visite *www.ctc8309.com.ar*');
  }
);
