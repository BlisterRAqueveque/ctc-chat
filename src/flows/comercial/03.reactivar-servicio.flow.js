import { addKeyword, utils } from '@builderbot/bot';
import { localidades } from '../../common/index.js';
import { otraLocalidad } from './02.quiero-ser-cliente.flow.js';
import { envs } from '../../configuration/envs.js';

export const reactivarServicioFlow = addKeyword(
  utils.setEvent('REACTIVAR_SERVICIO')
)
  .addAnswer('¡Gracias por elegirnos nuevamente!')
  .addAnswer(
    'Por favor, indica tu número de DNI/CUIL/CUIT:',
    { capture: true },
    async (ctx, { state, gotoFlow }) => {
      const opt = ctx.body.toLocaleLowerCase();

      if (opt == 'salir') return;

      await state.update({ dni: opt });

      return gotoFlow(reactivarNombreFlow);
    }
  );

export const reactivarNombreFlow = addKeyword(
  utils.setEvent('REACTIVAR_NOMBRE_SERVICIO')
).addAnswer(
  '¡Muy bien! Ahora indique su nombre y apellido por favor',
  { capture: true },
  async (ctx, { state, gotoFlow }) => {
    const opt = ctx.body;

    if (opt.trim().toLowerCase() === 'salir') return;

    await state.update({ nombre: opt });

    return gotoFlow(reactivarLocalidadFlow);
  }
);

export const reactivarLocalidadFlow = addKeyword(
  utils.setEvent('REACTIVAR_LOCALIDAD_SERVICIO')
).addAnswer(
  'Indica tu Localidad:' +
    localidades.map((localidad, i) => {
      return { body: `\n${i + 1}. ${localidad}` };
    }),
  {
    capture: true,
    // buttons: localidades.map((localidad, i) => {
    //   return { body: `${i + 1}. ${localidad}` };
    // }),
  },
  async (ctx, { state, fallBack, gotoFlow, endFlow }) => {
    const opt = ctx.body.trim().toLowerCase();

    if (opt == 'salir') return;

    // extraer el número inicial (soporta "1", "1.", "1. Centenario")
    const match = opt.match(/^(\d+)/);
    const localidad = match ? parseInt(match[1], 10) : NaN;

    if (isNaN(localidad) || localidad > localidades.length || localidad < 1) {
      return fallBack(`Opción incorrecta, Indica tu Localidad:`);
    }

    await state.update({ localidad });

    if ([12, 13, 14].includes(localidad)) {
      return gotoFlow(otraLocalidad);
    }

    const data = { ...state.getMyState(), telefono: ctx.from };

    const fin = (ticketId) => {
      return endFlow(
        `Perfecto ${data.nombre}! Un asesor comercial recibió tu consulta y te responderá en horario laboral (Lun-Vie 08:00 a 15:30). La consulta fue elevada con el ticket n° ${ticketId}`
      );
    };

    fetch(`${envs.API_URL}v1/reactivar-servicio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        const json = await res.json(); // <-- leer el JSON de la respuesta
        let ticketId = json ? json.ticketId : 'Sin ticket asignado';

        fin(ticketId); // ahora sí envías los datos reales
      })
      .catch((err) => {
        fin({ error: err.message || err }); // opcional: enviar error
      });
  }
);
