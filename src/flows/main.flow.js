import { addKeyword } from '@builderbot/bot';
import { quieroSerClienteFlow } from './quiero-ser-cliente.flow.js';

const sam = `🙌 Hola! Soy *SAM* de Cooperativa Telefónica Centenario. Estoy para ayudarte.\nElija una opción:`;

export const mainMenuFlow = addKeyword(['hola', 'hi', 'menu']).addAnswer(
  sam,
  {
    capture: true,
    buttons: [
      { body: '1. Quiero ser cliente' },
      { body: '2. Fui cliente y quiero reactivar el Servicio' },
      { body: '3. Soy cliente/socio' },
    ],
  },
  async (ctx, { gotoFlow, fallBack }) => {
    const opt = ctx.body.trim().toLocaleLowerCase();

    if (opt == 'salir') return;

    switch (true) {
      case opt.includes('1'):
        return gotoFlow(quieroSerClienteFlow);
      //case opt.includes('2'):
      //return gotoFlow(reactivarServicioFlow);
      //case opt.includes('3'):
      //return gotoFlow(clienteSocioFlow);
      default:
        return fallBack('⚠️ Opción inválida.');
    }
  }
);
