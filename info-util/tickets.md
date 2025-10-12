# Tickets / Reclamos en Odoo (Helpdesk)

## Modelo y tabla
- **Modelo técnico:** `helpdesk.ticket`
- **Tabla en Postgres:** `helpdesk_ticket`
- **Relación con cliente (contacto):** `partner_id` (many2one a `res.partner`)
- **Otros modelos relacionados:**
  - `helpdesk.team` (Equipos de soporte)
  - `helpdesk.stage` (Etapas del ticket)
  - `helpdesk.ticket.type` (Tipos de ticket)
  - `mail.message` (historial / mensajes del ticket)

## Campos útiles en `helpdesk.ticket`
- `id`: ID del ticket
- `name`: Asunto / título del ticket
- `description`: Detalle del reclamo
- `partner_id`: Cliente asociado (`[id, "Nombre"]`)
- `team_id`: Equipo de helpdesk
- `ticket_type_id`: Tipo de ticket
- `stage_id`: Etapa actual
- `create_date`: Fecha de creación

> Tip: Para ver todos los campos, usar `fields_get` o modo desarrollador en el formulario del ticket.

## Consultas típicas (XML-RPC con `odoo-xmlrpc`)

### Listar algunos tickets
- **Método:** `search_read`
- **Modelo:** `helpdesk.ticket`
- **Ejemplo de campos:** `["id", "name", "partner_id", "stage_id", "team_id", "create_date"]`
- **Dominio:** `[]` (todos) o filtrado por `partner_id`, `team_id`, `stage_id`, etc.

### Crear un ticket
- **Método:** `create`
- **Modelo:** `helpdesk.ticket`
- **Payload mínimo recomendado:**
  ```json
  {
    "name": "Reclamo de <Nombre Cliente>",
    "description": "Texto del reclamo...",
    "partner_id": <ID res.partner>,
    "team_id": <ID helpdesk.team opcional>,
    "ticket_type_id": <ID helpdesk.ticket.type opcional>,
    "stage_id": <ID helpdesk.stage opcional>
  }
