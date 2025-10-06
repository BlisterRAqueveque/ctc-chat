import { addKeyword, utils } from '@builderbot/bot';

export const mainClientFlow = addKeyword(utils.setEvent('CLIENTES')).addAnswer(
  'Bienvenido a nuestra gestión, por favor seleccione una opción para continuar:',
  {
    capture: true,
    buttons: [
      { body: '1. Quiero saber sobre mi servicio' },
      { body: '2. Necesito mi factura' },
      { body: '3. Medios de pago' },
      { body: '4. Deseo hablar con un operador' },
      { body: '5. Necesito soporte ó asistencia técnica' },
    ],
  },
  async (ctx, { gotoFlow, fallBack }) => {
    const opt = ctx.body;

    if (opt == 'salir') return;

    switch (true) {
      case opt.includes('1'):
        return gotoFlow(aboutClientFlow);
      //   case opt.includes('2'):
      //     return gotoFlow(reactivarServicioFlow);
      //   case opt.includes('3'):
      //     return gotoFlow(socioFlow);
      //   case opt.includes('4'):
      //     return gotoFlow(socioFlow);
      //   case opt.includes('5'):
      //     return gotoFlow(socioFlow);
      default:
        return fallBack('⚠️ Opción inválida.');
    }
  }
);

export const aboutClientFlow = addKeyword(
  utils.setEvent('SOBRE_SERVICIO')
).addAnswer(
  'Quiero saber sobre mi servicio',
  {
    capture: true,
    buttons: [
      { body: '1. ¿Qué servicio tengo?' },
      { body: '2. Cambio de domicilio' },
      { body: '3. Aumentar la velocidad' },
      { body: '4. Otras consultas' },
      { body: '5. Volver al menú' },
    ],
  },
  async (ctx, { fallBack, gotoFlow, state }) => {
    const opt = ctx.body;

    if (opt == 'salir') return;

    switch (true) {
      case opt.includes('1'): {
        //TODO Buscar los datos del usuario
        const mockData = {
          id: 1,
          datos: 'Alguno',
        };

        await state.update({ miServicio: JSON.stringify(mockData) });

        return gotoFlow(miServicioFlow);
      }
      //   case opt.includes('2'):
      //     return gotoFlow(reactivarServicioFlow);
      //   case opt.includes('3'):
      //     return gotoFlow(socioFlow);
      //   case opt.includes('4'):
      //     return gotoFlow(socioFlow);
      //   case opt.includes('5'):
      //     return gotoFlow(socioFlow);
      default:
        return fallBack('⚠️ Opción inválida.');
    }
  }
);

//TODO la data es la información del usuario
export const miServicioFlow = addKeyword(
  utils.setEvent('MI_SERVICIO')
).addAnswer(
  'Sobre su servicio:',
  {
    capture: true,
    buttons: [{ body: '1. Volver al menú' }, { body: '2. Finalizar' }],
  },
  async (ctx, { flowDynamic, state, gotoFlow }) => {
    const data = state.get('miServicio');
    await flowDynamic(`${JSON.stringify(data)}`);

    return gotoFlow(endMessageFlow);
  }
);

export const endMessageFlow = addKeyword(
  utils.setEvent('END_FLOW_CLIENT')
).addAnswer(
  'Finalizando su consulta',
  { capture: true },
  async (ctx, { gotoFlow, endFlow, fallBack }) => {
    const opt = ctx.body.toLocaleLowerCase();

    if (opt.includes('1')) return gotoFlow(aboutClientFlow);
    if (opt.includes('2')) return endFlow('Gracias por confiar en nosotros');
    else return fallBack('Opción ingresada incorrecta');
  }
);
