import { addKeyword, utils } from '@builderbot/bot';
import { preFinishTecnicaFlow } from './06.end-tecnica.flow.js';
import { envs } from '../../configuration/envs.js';

/* -------------------- 1️⃣ TIPO DE GESTIÓN -------------------- */
const tipoGestionButtons = [
  { body: '1. *Asistencia de línea*' },
  { body: '2. *Instalación de línea*' },
];

const tipoGestionText =
  'Seleccioná una opción (*ingresa solo números*):' +
  tipoGestionButtons.map((b) => `\n${b.body}`);

export const soporteAsistenciaFlow = addKeyword(
  utils.setEvent('ASISTENCIA_INSTALACION_TECNICA')
).addAnswer(
  tipoGestionText,
  { capture: true },
  async (ctx, { fallBack, gotoFlow, state }) => {
    const opt = ctx.body.trim();

    if (opt.toLowerCase() === 'salir') return;

    const tipoGestion =
      tipoGestionButtons
        .map((t) => t.body)
        .find((t) => t.includes(opt))
        ?.split('. ')[1] || '';

    await state.update({ tipoGestion });

    switch (+opt) {
      case 1:
        return gotoFlow(soporteAsistenciaDatoFlow);
      case 2:
        return gotoFlow(soporteInstalacionDatoFlow);
      default:
        return fallBack(`Opción incorrecta.\n${tipoGestionText}`);
    }
  }
);

/* -------------------- 2️⃣ CAPTURA DE DATO -------------------- */
export const soporteAsistenciaDatoFlow = addKeyword(
  utils.setEvent('ASISTENCIA_DATO')
).addAnswer(
  'Ingresá el *número de ticket, teléfono o DNI* asociado al reclamo:',
  { capture: true },
  async (ctx, { gotoFlow, state }) => {
    const dato = ctx.body.trim();
    if (dato.toLowerCase() === 'salir') return;

    await state.update({ dato });

    return gotoFlow(soporteAsistenciaFinFlow);
  }
);

export const soporteInstalacionDatoFlow = addKeyword(
  utils.setEvent('INSTALACION_DATO')
).addAnswer(
  'Ingresá tu *DNI* para coordinar la instalación:',
  { capture: true },
  async (ctx, { gotoFlow, state }) => {
    const dato = ctx.body.trim();
    if (dato.toLowerCase() === 'salir') return;

    await state.update({ dato });

    return gotoFlow(soporteAsistenciaFinFlow);
  }
);

/* -------------------- 3️⃣ CONFIRMACIÓN FINAL -------------------- */
export const soporteAsistenciaFinFlow = addKeyword(
  utils.setEvent('ASISTENCIA_INSTALACION_FIN')
).addAnswer(
  'Procesando solicitud...',
  null,
  async (ctx, { state, gotoFlow, flowDynamic }) => {
    const { tipoGestion, dato, nro_cliente, nombre, dni } = state.getMyState();
    const telefono = ctx.from;

    // 🔹 Se envía el registro a la API
    fetch(`${envs.API_URL}v1/registros-tecnica-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoGestion,
        dato,
        telefono,
        nro_cliente,
        nombre,
        dni,
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
