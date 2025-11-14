import { addKeyword, utils } from '@builderbot/bot';
import { preFinishTecnicaFlow } from './06.end-tecnica.flow.js';
import { envs } from '../../configuration/envs.js';

// Texto de la respuesta principal
const text = `Por favor, escribí tu comentario o reclamo detallado 
(por ejemplo: correr un poste, mover una línea, etc).`;

// Flow principal
export const soporteOtrosFlow = addKeyword(
  utils.setEvent('OTROS_TECNICA')
).addAnswer(
  text,
  { capture: true },
  async (ctx, { flowDynamic, state, gotoFlow }) => {
    const opt = ctx.body.trim();

    if (opt.toLocaleLowerCase() == 'salir') return;

    await flowDynamic('Muy bien...');

    const { nro_cliente, nombre, dni } = state.getMyState();
    const telefono = ctx.from;

    // 🔹 Se envía el registro a la API
    fetch(`${envs.API_URL}v1/registros-tecnica-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefono,
        nro_cliente,
        nombre,
        dni,
        consulta: opt,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        const ticketId = json?.ticketId || 'Sin ticket asignado';

        await flowDynamic(
          `¡Perfecto! Tu solicitud fue registrada correctamente. Un técnico se comunicará a la brevedad.\nTu número de seguimiento es: *${ticketId}*`
        );

        return gotoFlow(preFinishTecnicaFlow);
      })
      .catch(async (err) => {
        console.error(err);
        await flowDynamic(
          'Ocurrió un error al registrar tu solicitud. Por favor, intentá más tarde.'
        );
        return gotoFlow(preFinishTecnicaFlow);
      });
  }
);
