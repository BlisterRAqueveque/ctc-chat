import { envs } from '../configuration/envs.js';

export const fetchSessionID = async () => {
  const dir = `${envs.ODOO_API}web/session/authenticate`;

  const body = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      db: envs.ODOO_DB_NAME,
      login: envs.ODOO_LOGIN,
      password: envs.ODOO_PASS,
    },
  };

  try {
    const res = await fetch(dir, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // OBTENER EL HEADER SET-COOKIE
    const setCookie = res.headers.get('set-cookie');

    if (!setCookie) throw new Error('No se recibió cookie de sesión.');

    // EXTRAER EL SESSION_ID
    const match = setCookie?.match(/session_id=([^;]+)/);
    const session_id = match ? match[1] : null;

    const data = await res.json();

    return {
      session_id,
      user_uid: data.result?.uid,
    };
  } catch (err) {
    console.error('Error al obtener sesión:', err);
  }
};

/**
 * Consulta partners en Odoo.
 *
 * @param {Array} query - Ejemplo: [['vat', '=', '20304050607']]
 * @returns {Promise<Array<{id: number, name: string, email: string|null, vat: string|null}>|null>}
 */
export const getPartner = async (query = []) => {
  const dir = `${envs.ODOO_API}/jsonrpc`;
  const { session_id, user_uid } = await fetchSessionID(); // tu función que obtiene el session_id válido

  const body = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        envs.ODOO_DB_NAME, // nombre de la base de datos
        user_uid, // uid del usuario autenticado
        envs.ODOO_PASS, // la contraseña o token del usuario (depende del tipo de login que uses)
        'res.partner', // modelo
        'search_read', // método
        [query], // dominio de búsqueda
        {
          fields: [
            'id',
            'name',
            'email',
            'vat',
            'phone',
            'x_studio_id_de_contrato',
            'street',
            'city',
          ],
        }, //TODO campo del número del cliente
      ],
    },
  };

  try {
    const res = await fetch(dir, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        session_id, // 👈 ellos esperan el session_id así
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.error) {
      console.error('Error en la consulta:', data.error);
      return null;
    }

    console.log(data.result);

    return data.result; // devuelve el resultado del search_read
  } catch (err) {
    console.error('Error al consultar el partner:', err);
    return null;
  }
};

export const getPartnerServices = async (partnerId) => {
  const { session_id, user_uid } = await fetchSessionID(); // tu función que obtiene el session_id válido

  const serviceRes = await fetch(`${envs.ODOO_API}/jsonrpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      session_id,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          envs.ODOO_DB_NAME,
          user_uid,
          envs.ODOO_PASS,
          'sale.order', // modelo del servicio
          'search_read',
          [
            [
              ['partner_id', '=', partnerId],
              ['subscription_state', '=', '3_progress'],
            ],
          ],
          {
            fields: [
              'id',
              'name',
              'plan_id',
              'recurring_total',
              'next_invoice_date',
              'subscription_state',
            ],
          },
        ],
      },
    }),
  });

  const data = await serviceRes.json();

  console.log(data);

  return data;
};
