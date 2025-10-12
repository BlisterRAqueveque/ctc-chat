import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Odoo = require("odoo-xmlrpc");

import { envs } from "../configuration/envs.js";

class OdooService {
  constructor() {
    this.config = {
      url: envs.ODOO_URL,
      db: envs.ODOO_DB_NAME,
      username: envs.ODOO_USERNAME, 
      password: envs.ODOO_API_KEY,
    };

    this.odoo = null;
    this.isConnected = false;
  }

  // --- Conexión a Odoo ---
  async connect() {
    if (this.isConnected && this.odoo) return true;

    this.odoo = new Odoo({
      url: this.config.url,
      db: this.config.db,
      username: this.config.username,
      password: this.config.password,
    });

    return new Promise((resolve, reject) => {
      this.odoo.connect((err) => {
        if (err) {
          console.error("Error al conectar con Odoo:", err);
          this.isConnected = false;
          return reject(err);
        }
        this.isConnected = true;
        console.log("Conectado a Odoo");
        resolve(true);
      });
    });
  }

  // --- Ejecutar un método de Odoo ---
  async execute_kw(model, method, params = []) {
    await this.connect();
    return new Promise((resolve, reject) => {
      try {
        this.odoo.execute_kw(model, method, params, (err, value) => {
          if (err) return reject(err);
          resolve(value);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // --- Buscar y leer registros ---
  /**
    @description Realiza una búsqueda y lectura combinada (search_read) en Odoo.
       Odoo espera los parámetros en dos partes:
       - `args`: lista con el dominio (filtros de búsqueda)
       - `kwargs`: objeto con opciones como los campos, el offset y el límite
       Este método se usa para obtener registros de cualquier modelo,
       aplicando un filtro (`domain`) y eligiendo qué campos devolver (`fields`).

    @example Ejemplo de uso:
        searchRead("res.partner", [["email", "=", "cliente@mail.com"]],
        ["id", "name", "email"], 0, 10);
           Retorna: una lista de objetos con los datos de Odoo.
   */
  async searchRead(model, domain = [], fields = [], offset = 0, limit = 80) {
    // params = [ args, kwargs ]
    const args = [domain]; // Odoo espera args como lista con el domain
    const kwargs = { fields, offset, limit };
    const params = [args, kwargs];
    return this.execute_kw(model, "search_read", params);
  }

  async read(model, ids = [], fields = []) {
    const args = [ids];
    const kwargs = { fields };
    const params = [args, kwargs];
    return this.execute_kw(model, "read", params);
  }

  // --- Método principal usado por el chatbot ---
  async validarAsociado(nro_cliente, dni, nombre) {
    try {
      await this.connect();

      // Dominio: buscamos por número de contrato o cliente
      const domain = [["x_studio_id_de_contrato", "=", String(nro_cliente)]];
      const fields = [
        "id",
        "name",
        "ref",
        "x_studio_id_de_contrato",
        "email",
        "phone",
        "mobile",
        "street",
        "city",
        "vat", //! aca va el dni... POR QUE RAJA NO LE PUSIERON DNI AL CAMPO DNI QUE ALAMCENA EL DNI... EL DIABLO... 
      ];

      const results = await this.searchRead(
        "res.partner",
        domain,
        fields,
        0,
        1
      );

      if (!results || results.length === 0) {
        return { status: 404, message: "Cliente no encontrado" };
      }

      const cliente = results[0];

      // Validación del DNI
      if (dni && cliente.vat && cliente.vat !== dni) {
        return { status: 404, message: "El DNI no coincide con el registro" };
      }

      // Validación del nombre (comparación flexible)
      if (
        nombre &&
        cliente.name &&
        !cliente.name.toLowerCase().includes(nombre.toLowerCase())
      ) {
        return {
          status: 404,
          message: "El nombre no coincide con el registro",
        };
      }

      // Éxito
      return { status: 200, data: cliente, message: "Cliente validado" };
    } catch (err) {
      console.error("Error en validarAsociado:", err.message || err);
      return { status: 500, message: "Error en conexión con Odoo" };
    }
  }
}

export const odooService = new OdooService();
export default odooService;
