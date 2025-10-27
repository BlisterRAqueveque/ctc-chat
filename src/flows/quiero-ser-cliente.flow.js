import { addKeyword, utils } from '@builderbot/bot';
import { preFinishFlow } from './end.flow.js';
import { envs } from '../configuration/envs.js';
import { localidades } from '../common/index.js';

const textLocalidad = `Indica tu Localidad:`;

const textServicio = '¿Qué tipo de servicio deseas?';

const textOpciones = [
  { body: '1. *Quiero servicio para mi HOGAR*' },
  { body: '2. *Quiero servicio para mi COMERCIO/OFICINA*' },
  { body: '3. *Quiero servicio para mi EMPRESA/CORPORATIVO*' },
];

export const quieroSerClienteFlow = addKeyword(
  utils.setEvent('SER_CLIENTE')
).addAnswer(
  textServicio + textOpciones.map((b) => `\n${b.body}`),
  {
    capture: true,
    // buttons: [
    //   { body: '1. Quiero servicio para mi HOGAR' },
    //   { body: '2. Quiero servicio para mi COMERCIO/OFICINA' },
    //   { body: '3. Quiero servicio para mi EMPRESA/CORPORATIVO' },
    // ],
  },
  async (ctx, { gotoFlow, fallBack }) => {
    const opt = ctx.body.trim();

    if (opt.toLocaleLowerCase() !== 'salir')
      switch (true) {
        case opt.includes('1'):
          return gotoFlow(registrar);
        default:
          return fallBack(`Opción incorrecta, ${textServicio}`);
      }
  }
);

export const registrar = addKeyword(utils.setEvent('REGISTRAR')).addAnswer(
  textLocalidad + localidades.map((localidad, i) => `\n${i + 1}. ${localidad}`),
  {
    capture: true,
    // buttons: localidades.map((localidad, i) => {
    //   return { body: `${i + 1}. ${localidad}` };
    // }),
  },
  async (ctx, { state, fallBack, gotoFlow }) => {
    const opt = ctx.body.trim().toLowerCase();

    if (opt == 'salir') return;

    // extraer el número inicial (soporta "1", "1.", "1. Centenario")
    const match = opt.match(/^(\d+)/);
    const localidad = match ? parseInt(match[1], 10) : NaN;

    if (isNaN(localidad) || localidad > localidades.length || localidad < 1) {
      return fallBack(`Opción incorrecta, ${textLocalidad}`);
    }

    await state.update({ localidad });

    if ([12, 13, 14].includes(localidad)) {
      return gotoFlow(otraLocalidad);
    }

    return gotoFlow(ubicacionFlow);
  }
);

export const otraLocalidad = addKeyword(
  utils.setEvent('OTRA_LOCALIDAD')
).addAnswer(
  'En tu localidad por favor comunícate al *2984 53-0580* o al mail *cacnet.oficina@gmail.com*',
  null,
  async (_, { gotoFlow }) => {
    return gotoFlow(preFinishFlow);
  }
);

export const ubicacionFlow = addKeyword(utils.setEvent('UBICACION')).addAnswer(
  'Por favor indícanos la *calle y altura exacta* o *COMPARTE TU UBICACIÓN* para verificar la factibilidad.',
  { capture: true },
  async (ctx, { state, gotoFlow }) => {
    const opt = ctx.body?.trim() || '';

    if (opt.toLocaleLowerCase() !== 'salir') {
      const location = ctx?.message?.locationMessage;

      if (location) {
        const lat = location.degreesLatitude;
        const lon = location.degreesLongitude;

        await state.update({ lat, lon, ubicacion: '' });
      } else {
        await state.update({ lat: '', lon: '', ubicacion: opt });
      }

      return gotoFlow(nombreFlow);
    }
  }
);

export const nombreFlow = addKeyword(utils.setEvent('DATOS')).addAnswer(
  `Ahora indícanos tu *nombre y apellido*`,
  { capture: true },
  async (ctx, { state, endFlow }) => {
    await state.update({ nombre: ctx.body });

    /**
     * ! Example item:
     * const item = {
     *    localidad: 1,
     *    lat: -38.93142318725586,
     *    lon: -67.97035217285156,
     *    ubcacion: '',
     *    nombre: 'Asd',
     *    telefono: ctx.from
     * };
     */
    const data = { ...state.getMyState(), telefono: ctx.from };

    const fin = (ticketId) => {
      return endFlow(
        `Perfecto ${ctx.body}! Un asesor comercial recibió tu consulta y te responderá en horario laboral (Lun-Vie 08:00 a 15:30). La consulta fue elevada con el ticket n° ${ticketId}`
      );
    };

    fetch(`${envs.API_URL}v1/registrar`, {
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
