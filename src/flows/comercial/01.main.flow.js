import { addKeyword } from '@builderbot/bot';
import { quieroSerClienteFlow } from './02.quiero-ser-cliente.flow.js';
import { reactivarServicioFlow } from './03.reactivar-servicio.flow.js';
import { socioFlow } from './04.soy-cliente.flow.js';

// const sam = `🙌 Hola! Soy *SAM* de Cooperativa Telefónica Centenario. Estoy para ayudarte.\nElija una opción:`;
const sam = `🙌 Hola! Soy *SAM* de Cooperativa Telefónica Centenario. Estoy para ayudarte.\nIngrese una opción (*solo números*):`;

const opciones = [
  { body: '1. *Quiero ser cliente*' },
  { body: '2. *Fui cliente y quiero reactivar el Servicio*' },
  { body: '3. *Soy cliente/socio*' },
];

export const mainMenuFlow = addKeyword(['hola', 'hi', 'menu']).addAnswer(
  sam + opciones.map((b) => `\n${b.body}`),
  {
    capture: true,
    // buttons: [
    //   { body: '1. Quiero ser cliente' },
    //   { body: '2. Fui cliente y quiero reactivar el Servicio' },
    //   { body: '3. Soy cliente/socio' },
    // ],
  },
  async (ctx, { gotoFlow, fallBack }) => {
    const opt = ctx.body.trim().toLocaleLowerCase();

    if (opt == 'salir') return;

    switch (true) {
      case opt.includes('1'):
        return gotoFlow(quieroSerClienteFlow);
      case opt.includes('2'):
        return gotoFlow(reactivarServicioFlow);
      case opt.includes('3'):
        return gotoFlow(socioFlow);
      default:
        return fallBack('⚠️ Opción inválida.');
    }
  }
);
