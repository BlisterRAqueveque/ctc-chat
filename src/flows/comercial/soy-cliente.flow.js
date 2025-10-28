import { addKeyword, utils } from '@builderbot/bot';
// import { mainClientFlow } from './soy-cliente.subflow.js';
// import { odooService } from '../services/odoo.service.js';
// import { envs } from '../configuration/envs.js';
import { aboutClientFlow } from './soy-cliente.subflow-01.js';

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

    const data = { ...state.getMyState(), telefono: ctx.from };

    try {
      await flowDynamic('🔍 Verificando tu información en nuestro sistema...');

      console.log('[FLOW] Validando con Odoo:', data);

      // const resultado = await odooService.validarAsociado(
      //   data.nro_cliente,
      //   data.dni,
      //   data.nombre
      // );
      const resultado = {
        data: {
          x_studio_id_de_contrato: 'x_studio_id_de_contrato',
          name: 'name',
          phone: 'phone',
          email: 'email',
          street: 'street',
          city: 'city',
        },
        status: 200,
      };

      console.log('[FLOW] Resultado de Odoo:', resultado);

      switch (resultado.status) {
        case 200:
          // Actualizamos el state con los datos de Odoo
          await state.update({
            cliente_odoo: resultado.data,
            miServicio: JSON.stringify({
              id: resultado.data.x_studio_id_de_contrato,
              nombre: resultado.data.name,
              telefono: resultado.data.phone,
              email: resultado.data.email,
              direccion: resultado.data.street,
              ciudad: resultado.data.city,
            }),
          });
          await flowDynamic(`✅ ¡Perfecto! Hola ${resultado.data.name}.`);
          return gotoFlow(mainClientFlow);

        case 404: {
          const retry = state.get('retry');
          if (retry == 1) {
            return endFlow(
              'No fue posible verificar su información. Un asesor ya recibió su consulta, a la brevedad le responderá en horario Comercial de Lunes a Viernes de 08.00 a 15.30 hs.'
            );
          }
          await flowDynamic(
            `La información provista es incorrecta. ${resultado.message}`
          );
          await state.update({ retry: 1 });
          return gotoFlow(socioFlow);
        }

        default:
          await flowDynamic(
            `Algo salió mal con nuestros servidores, favor de tener paciencia. Código: ${resultado.status}`
          );
          return gotoFlow(socioFlow);
      }
    } catch (err) {
      console.error('Error en validación con Odoo:', err);
      await flowDynamic(
        'Error temporal de conexión. Por favor, intenta nuevamente en unos momentos.'
      );
      return gotoFlow(socioFlow);
    }
  }
);

const textOpciones = [
  { body: '1. *Quiero saber sobre mi servicio*' },
  { body: '2. *Necesito mi factura*' },
  { body: '3. *Medios de pago*' },
  { body: '4. *Deseo hablar con un operador*' },
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
