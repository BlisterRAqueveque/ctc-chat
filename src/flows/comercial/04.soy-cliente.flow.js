import { addKeyword, utils } from '@builderbot/bot';
// import { mainClientFlow } from './soy-cliente.subflow.js';
// import { odooService } from '../services/odoo.service.js';
// import { envs } from '../configuration/envs.js';
import { soportePrincipalFlow } from '../tecnica/01.main-tecnica.flow.js';
import { aboutClientFlow } from './04.soy-cliente.subflow-01.js';
import { mainFacturaFlow } from './04.soy-cliente.subflow-02.js';
import { getPartner } from '../../services/odoo-service.js';

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

    if (opt.trim().toLowerCase() === 'salir') return;

    await state.update({ nombre: opt });

    const data = { ...state.getMyState(), telefono: ctx.from };

    try {
      await flowDynamic('🔍 Verificando tu información en nuestro sistema...');
      console.log('[FLOW] Validando con Odoo:', data);

      const resultado = (await getPartner([['vat', '=', data.dni]]))?.[0];

      if (resultado) {
        await state.update({
          cliente_odoo: resultado,
          miServicio: JSON.stringify({
            id: resultado.x_studio_id_de_contrato,
            nombre: resultado.name,
            telefono: resultado.phone,
            email: resultado.email,
            direccion: resultado.street,
            ciudad: resultado.city,
          }),
        });

        await flowDynamic(`✅ ¡Perfecto! Hola ${resultado.name}.`);
        return gotoFlow(mainClientFlow);
      }

      const retry = state.get('retry');
      if (retry === 1) {
        return endFlow(
          'No fue posible verificar su información. Un asesor ya recibió su consulta, a la brevedad le responderá en horario comercial (Lunes a Viernes de 08:00 a 15:30 hs).'
        );
      }

      await flowDynamic(
        `La información provista es incorrecta o no se encuentra en el sistema.`
      );
      await state.update({ retry: 1 });
      return gotoFlow(socioFlow);
    } catch (error) {
      console.error('Error en validación con Odoo:', error);
      await flowDynamic(
        'Error temporal de conexión. Por favor, intenta nuevamente en unos momentos.'
      );
      return gotoFlow(socioFlow);
    }
  }
);

const textOpciones = [
  { body: '1. *Quiero saber sobre mi servicio*' },
  { body: '2. *Necesito mi factura*' }, // TODO
  { body: '3. *Medios de pago*' }, // TODO
  { body: '4. *Deseo hablar con un operador*' }, // TODO
  { body: '5. *Necesito soporte ó asistencia técnica*' },
];

export const mainClientFlow = addKeyword(utils.setEvent('CLIENTES')).addAnswer(
  // 'Bienvenido a nuestra gestión, por favor seleccione una opción para continuar:',
  'Bienvenido a nuestra gestión, por favor ingrese una opción para continuar (*solo números*):' +
    textOpciones.map((b) => `\n${b.body}`),
  {
    capture: true,
    // buttons: [
    //   { body: '1. Quiero saber sobre mi servicio' },
    //   { body: '2. Necesito mi factura' },
    //   { body: '3. Medios de pago' },
    //   { body: '4. Deseo hablar con un operador' },
    //   { body: '5. Necesito soporte ó asistencia técnica' },
    // ],
  },
  async (ctx, { gotoFlow, fallBack }) => {
    const opt = ctx.body;

    if (opt == 'salir') return;

    switch (true) {
      case opt.includes('1'):
        return gotoFlow(aboutClientFlow);
      case opt.includes('2'):
        return gotoFlow(mainFacturaFlow);
      //   case opt.includes('3'):
      //     return gotoFlow(socioFlow);
      //   case opt.includes('4'):
      //     return gotoFlow(socioFlow);
      case opt.includes('5'):
        return gotoFlow(soportePrincipalFlow);
      default:
        return fallBack('⚠️ Opción inválida.');
    }
  }
);
