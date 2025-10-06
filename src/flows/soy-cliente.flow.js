import { addKeyword, utils } from '@builderbot/bot';
import { envs } from '../configuration/envs.js';
import { mainClientFlow } from './soy-cliente.subflow.js';

const infoOne =
  'Para poder ayudarte, por favor Indicar:\n1. Nº de cliente/teléfono (ver como aparece el formato en Odoo)';
const infoTwo = 'Ahora indique:\n2. DNI/CUIL (sin espacios)';
const infoTree = 'Y para terminar:\n3. Apellido y nombre del titular';

export const socioFlow = addKeyword(utils.setEvent('SOCIO_SERVICIO')).addAnswer(
  infoOne,
  { capture: true },
  async (ctx, { state, gotoFlow }) => {
    const opt = ctx.body.toLocaleLowerCase();

    if (opt == 'salir') return;

    const retry = state.get('retry');

    if (retry == 1) {
      await state.update({ nro_cliente: opt });
      return gotoFlow(socioDNIFlow);
    } else {
      await state.update({ nro_cliente: opt, retry: 0 });
      return gotoFlow(socioDNIFlow);
    }
  }
);

export const socioDNIFlow = addKeyword(
  utils.setEvent('SOCIO_DNI_SERVICIO')
).addAnswer(infoTwo, { capture: true }, async (ctx, { state, gotoFlow }) => {
  const opt = ctx.body.toLocaleLowerCase();

  if (opt == 'salir') return;

  await state.update({ dni: opt });

  return gotoFlow(socioNombreFlow);
});

export const socioNombreFlow = addKeyword(
  utils.setEvent('SOCIO_NOMBRE_SERVICIO')
).addAnswer(
  infoTree,
  { capture: true },
  async (ctx, { state, gotoFlow, flowDynamic, endFlow }) => {
    const opt = ctx.body;

    if (opt.toLocaleLowerCase() == 'salir') return;

    await state.update({ nombre: opt });

    //TODO validar nro_cliente
    const data = { ...state.getMyState(), telefono: ctx.from };

    fetch(`${envs.API_URL}v1/cliente/${data.nro_cliente}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        const json = await res.json();
        const { status = 500 } = json;

        switch (+status) {
          case 200:
            return gotoFlow(mainClientFlow);
          case 404: {
            const retry = state.get('retry');
            if (retry == 1) {
              return endFlow(
                'No fue posible verificar su información. Un asesor ya recibió su consulta, a la brevedad le responderá en horario Comercial de Lunes a Viernes de 08.00 a 15.30 hs.'
              );
            }
            await flowDynamic(`La información provista es incorrecta`);
            await state.update({ retry: 1 });
            return gotoFlow(socioFlow);
          }
          default:
            await flowDynamic(
              `Algo salió mal con nuestros servidores, favor de tener paciencia, ${status}`
            );
            return gotoFlow(socioFlow);
        }
      })
      .catch(async (err) => {
        await flowDynamic(
          `Algo salió mal con nuestros servidores, favor de tener paciencia, ${JSON.stringify(
            err
          )}`
        );
        return gotoFlow(socioFlow);
      });
  }
);
